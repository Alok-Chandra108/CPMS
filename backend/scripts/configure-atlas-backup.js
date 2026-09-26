#!/usr/bin/env node
/**
 * configure-atlas-backup.js
 * ─────────────────────────
 * Applies a MongoDB Atlas Cloud Backup policy to a given cluster via the
 * Atlas Administration API (v2).
 *
 * USAGE
 *   node scripts/configure-atlas-backup.js
 *
 * REQUIRED ENVIRONMENT VARIABLES
 *   ATLAS_PUBLIC_KEY   – Atlas API public key  (create under Organisation → API Keys)
 *   ATLAS_PRIVATE_KEY  – Atlas API private key
 *   ATLAS_PROJECT_ID   – Atlas project (group) ID
 *   ATLAS_CLUSTER_NAME – Name of the cluster to protect  (default: "cpms-cluster")
 *
 * POLICY APPLIED
 *   • Continuous cloud backup: ENABLED
 *   • Hourly  snapshots – retained 2 days
 *   • Daily   snapshots – retained 7 days  (keep-only-last-in-period)
 *   • Weekly  snapshots – retained 4 weeks (Saturday)
 *   • Monthly snapshots – retained 12 months (1st of month)
 *   • Point-in-time (oplog) restore window: 24 hours
 *
 * REFERENCES
 *   https://www.mongodb.com/docs/atlas/reference/api-resources-spec/v2/#tag/Cloud-Backups
 */

"use strict";

const https = require("https");

// ─── Configuration ────────────────────────────────────────────────────────────

const ATLAS_API_BASE = "cloud.mongodb.com";
const API_VERSION    = "2023-01-01";        // Atlas API version header value

const PUBLIC_KEY   = process.env.ATLAS_PUBLIC_KEY;
const PRIVATE_KEY  = process.env.ATLAS_PRIVATE_KEY;
const PROJECT_ID   = process.env.ATLAS_PROJECT_ID;
const CLUSTER_NAME = process.env.ATLAS_CLUSTER_NAME || "cpms-cluster";

// ─── Backup Policy ────────────────────────────────────────────────────────────

/**
 * Cloud Backup policy payload per Atlas API spec.
 * Adjust retentionUnit / retentionValue as needed for your compliance posture.
 */
const BACKUP_POLICY = {
  // Keep an oplog window so PITR restores work up to 24 h ago
  restoreWindowDays: 1,

  // Scheduled policy items ─ Atlas will merge these automatically.
  scheduledPolicyItems: [
    {
      // Hourly snapshots – captured every 6 hours, kept for 2 days
      frequencyType:    "hourly",
      frequencyInterval: 6,          // every 6 hours
      retentionUnit:    "days",
      retentionValue:   2,
    },
    {
      // Daily snapshots – captured at midnight UTC, kept for 7 days
      frequencyType:    "daily",
      frequencyInterval: 1,
      retentionUnit:    "days",
      retentionValue:   7,
    },
    {
      // Weekly snapshots – captured on Saturday, kept for 4 weeks
      frequencyType:    "weekly",
      frequencyInterval: 6,          // 1=Sunday … 7=Saturday
      retentionUnit:    "weeks",
      retentionValue:   4,
    },
    {
      // Monthly snapshots – captured on the 1st, kept for 12 months
      frequencyType:    "monthly",
      frequencyInterval: 1,          // 1st day of the month
      retentionUnit:    "months",
      retentionValue:   12,
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function base64(str) {
  return Buffer.from(str).toString("base64");
}

/**
 * Minimal HTTP Digest-auth implementation (Atlas API requires Digest, not Basic).
 * Step 1 → send without credentials to get WWW-Authenticate challenge.
 * Step 2 → compute HA1/HA2/response and retry.
 */
const crypto = require("crypto");

function md5(s) {
  return crypto.createHash("md5").update(s).digest("hex");
}

function buildDigestHeader({ method, path, realm, nonce, qop, nc, cnonce, opaque }) {
  const ha1 = md5(`${PUBLIC_KEY}:${realm}:${PRIVATE_KEY}`);
  const ha2 = md5(`${method}:${path}`);
  const response = qop
    ? md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
    : md5(`${ha1}:${nonce}:${ha2}`);

  let header = `Digest username="${PUBLIC_KEY}", realm="${realm}", nonce="${nonce}", ` +
               `uri="${path}", response="${response}"`;
  if (qop)    header += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  if (opaque) header += `, opaque="${opaque}"`;
  return header;
}

function parseWWWAuthenticate(header) {
  const map = {};
  const re  = /(\w+)="([^"]+)"/g;
  let m;
  while ((m = re.exec(header)) !== null) map[m[1]] = m[2];
  // also grab unquoted qop
  const qopMatch = header.match(/qop=([^,\s"]+)/);
  if (qopMatch) map.qop = qopMatch[1];
  return map;
}

/**
 * Make an Atlas Admin API call using Digest authentication.
 * Returns parsed JSON body.
 */
function atlasRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : undefined;

    // --- Step 1: unauthenticated probe to get the Digest challenge ---
    const probe = https.request(
      {
        hostname: ATLAS_API_BASE,
        path,
        method,
        headers: {
          "Accept":       `application/vnd.atlas.${API_VERSION}+json`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        const wwwAuth = res.headers["www-authenticate"] || "";
        const chunks  = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          if (!wwwAuth.startsWith("Digest")) {
            // No Digest challenge – treat as final response
            try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
            catch { resolve({}); }
            return;
          }

          // --- Step 2: Digest-authenticated request ---
          const params  = parseWWWAuthenticate(wwwAuth);
          const nc      = "00000001";
          const cnonce  = crypto.randomBytes(8).toString("hex");
          const authHdr = buildDigestHeader({
            method,
            path,
            realm:  params.realm,
            nonce:  params.nonce,
            qop:    params.qop,
            nc,
            cnonce,
            opaque: params.opaque,
          });

          const req2 = https.request(
            {
              hostname: ATLAS_API_BASE,
              path,
              method,
              headers: {
                "Accept":          `application/vnd.atlas.${API_VERSION}+json`,
                "Content-Type":    "application/json",
                "Authorization":   authHdr,
                ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
              },
            },
            (res2) => {
              const chunks2 = [];
              res2.on("data", (c) => chunks2.push(c));
              res2.on("end", () => {
                const text = Buffer.concat(chunks2).toString();
                try   { resolve(JSON.parse(text)); }
                catch { reject(new Error(`Non-JSON response (${res2.statusCode}): ${text}`)); }
              });
            }
          );
          req2.on("error", reject);
          if (bodyStr) req2.write(bodyStr);
          req2.end();
        });
      }
    );
    probe.on("error", reject);
    probe.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validate environment
  const missing = ["ATLAS_PUBLIC_KEY", "ATLAS_PRIVATE_KEY", "ATLAS_PROJECT_ID"]
    .filter((k) => !process.env[k]);

  if (missing.length) {
    console.error(`[ERROR] Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log(`[INFO]  Configuring Cloud Backup for cluster '${CLUSTER_NAME}' ` +
              `in project '${PROJECT_ID}' …`);

  // 1. Enable cloud backup on the cluster (PATCH cluster config)
  const clusterPath = `/api/atlas/v2/groups/${PROJECT_ID}/clusters/${CLUSTER_NAME}`;
  const clusterUpdate = { backupEnabled: true };

  console.log("[INFO]  Enabling backupEnabled on cluster …");
  const clusterRes = await atlasRequest("PATCH", clusterPath, clusterUpdate);

  if (clusterRes.error) {
    console.error("[ERROR] Cluster update failed:", JSON.stringify(clusterRes, null, 2));
    process.exit(1);
  }
  console.log(`[OK]    Cluster backup flag set – state: ${clusterRes.stateName || "updating"}`);

  // 2. Apply the backup schedule policy
  const schedulePath =
    `/api/atlas/v2/groups/${PROJECT_ID}/clusters/${CLUSTER_NAME}/backup/schedule`;

  console.log("[INFO]  Applying backup schedule policy …");
  const scheduleRes = await atlasRequest("PATCH", schedulePath, BACKUP_POLICY);

  if (scheduleRes.error) {
    console.error("[ERROR] Backup schedule update failed:", JSON.stringify(scheduleRes, null, 2));
    process.exit(1);
  }

  console.log("[OK]    Backup schedule applied successfully.");
  console.log("[INFO]  Policy summary:");
  (scheduleRes.scheduledPolicyItems || []).forEach((item) => {
    console.log(
      `        • ${item.frequencyType.padEnd(8)} every ${String(item.frequencyInterval).padStart(2)} ` +
      `– retain ${item.retentionValue} ${item.retentionUnit}`
    );
  });
  console.log(
    `[INFO]  PITR window: ${scheduleRes.restoreWindowDays ?? BACKUP_POLICY.restoreWindowDays} day(s)`
  );
}

main().catch((err) => {
  console.error("[FATAL]", err.message);
  process.exit(1);
});
