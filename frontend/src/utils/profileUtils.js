/**
 * Calculates weighted profile completion percentage.
 * 
 * Weighted sections:
 *  - Personal Info  (phone, DOB, gender, address) → 15%
 *  - Academics      (10th, 12th, CGPA)             → 30%
 *  - Skills         (at least 3 skills)            → 15%
 *  - Projects       (at least 1 project)           → 15%
 *  - Resume         (uploaded)                     → 25%
 */
export const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;
  let score = 0;

  // 1. Personal Info (15%)
  // phone, dateOfBirth, gender
  const personalFields = [profile.phone, profile.dateOfBirth, profile.gender];
  const personalFilled = personalFields.filter((f) => {
    if (f === null || f === undefined) return false;
    if (typeof f === 'string' && f.trim() === '') return false;
    return true;
  }).length;
  // If all 3 fields are filled, full 15%
  score += (personalFilled / personalFields.length) * 15;

  // 2. Academics (30%)
  // 10th (percentage, board), 12th (percentage, board), CGPA
  const academicFields = [
    profile.tenthPercentage,
    profile.tenthBoard,
    profile.twelfthPercentage,
    profile.twelfthBoard,
    profile.cgpa,
  ];
  const academicFilled = academicFields.filter((f) => {
    if (f === null || f === undefined) return false;
    if (typeof f === 'string' && f.trim() === '') return false;
    return true;
  }).length;
  score += (academicFilled / academicFields.length) * 30;

  // 3. Skills (15%)
  // Full 15% if 3 or more skills, else proportional
  if (profile.skills && profile.skills.length >= 3) {
    score += 15;
  } else if (profile.skills && profile.skills.length > 0) {
    score += (profile.skills.length / 3) * 15;
  }

  // 4. Projects (15%)
  // Full 15% if 1 or more projects
  if (profile.projects && profile.projects.length >= 1) {
    score += 15;
  }

  // 5. Resume (25%)
  if (profile.resumeUrl && profile.resumeUrl.trim() !== '') {
    score += 25;
  }

  return Math.round(score);
};
