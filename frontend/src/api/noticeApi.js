import api from './axiosInstance';

/**
 * Fetch all active (non-archived) notices
 * @param {Object} params - Query params (e.g., limit, page, category, search)
 */
export const fetchNotices = async (params = {}) => {
  const response = await api.get('/notices', { params });
  return response.data;
};

/**
 * Fetch a single notice by ID
 * @param {String} id - Notice ID
 */
export const fetchNoticeById = async (id) => {
  const response = await api.get(`/notices/${id}`);
  return response.data;
};

/**
 * Create a new notice
 * @param {Object} noticeData - Notice data payload
 */
export const createNotice = async (noticeData) => {
  let payload = noticeData;
  let headers = {};

  if (noticeData.noticePdf instanceof File) {
    payload = new FormData();
    Object.keys(noticeData).forEach(key => {
      if (noticeData[key] !== null && noticeData[key] !== undefined) {
        payload.append(key, noticeData[key]);
      }
    });
    headers['Content-Type'] = 'multipart/form-data';
  }

  const response = await api.post('/notices', payload, { headers });
  return response.data;
};

/**
 * Update an existing notice
 * @param {String} id - Notice ID
 * @param {Object} noticeData - Notice data payload
 */
export const updateNotice = async (id, noticeData) => {
  let payload = noticeData;
  let headers = {};

  if (noticeData.noticePdf instanceof File) {
    payload = new FormData();
    Object.keys(noticeData).forEach(key => {
      if (noticeData[key] !== null && noticeData[key] !== undefined) {
        payload.append(key, noticeData[key]);
      }
    });
    headers['Content-Type'] = 'multipart/form-data';
  }

  const response = await api.put(`/notices/${id}`, payload, { headers });
  return response.data;
};

/**
 * Delete a notice (soft delete — sets isActive=false)
 * @param {String} id - Notice ID
 */
export const deleteNotice = async (id) => {
  const response = await api.delete(`/notices/${id}`);
  return response.data;
};

// ── Archive API ────────────────────────────────────────────────────────────────

/**
 * Fetch all archived notices (admin/hr only)
 * @param {Object} params - Query params (e.g., limit, page, category, search)
 */
export const fetchArchivedNotices = async (params = {}) => {
  const response = await api.get('/notices/archived', { params });
  return response.data;
};

/**
 * Manually archive a notice (admin/hr only)
 * Immediately hides the notice from the student dashboard
 * @param {String} id - Notice ID
 */
export const archiveNoticeById = async (id) => {
  const response = await api.patch(`/notices/${id}/archive`);
  return response.data;
};

/**
 * Restore an archived notice back to active (admin/hr only)
 * Notice reappears on student dashboard immediately
 * @param {String} id - Notice ID
 */
export const restoreNoticeById = async (id) => {
  const response = await api.patch(`/notices/${id}/restore`);
  return response.data;
};

// ── Read-tracking API ─────────────────────────────────────────────────────────

/**
 * Mark a single notice as read for the logged-in user
 * @param {String} id - Notice ID
 */
export const markNoticeRead = async (id) => {
  const response = await api.patch(`/notices/${id}/read`);
  return response.data;
};

/**
 * Fetch the list of notice IDs the logged-in user has read
 */
export const fetchReadNotices = async () => {
  const response = await api.get('/notices/read');
  return response.data;
};
