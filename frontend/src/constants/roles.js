export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

export const DEPARTMENTS = [
  'Aeronautical Engineering',
  'Artificial Intelligence & Machine Learning',
  'Civil Engineering',
  'Computer Science & Engineering',
  'Computer Science & Engineering (Artificial Intelligence & Machine Learning)',
  'Computer Science & Engineering (IoT & Cyber Security with Blockchain Technology)',
  'Electronics & Communication Engineering',
  'Information Science & Engineering',
  'Mechanical Engineering',
  'Mechatronics Engineering',
  'Robotics & Artificial Intelligence',
  'MCA (Master of Computer Applications)',
  'MBA (Master of Business Administration)',
  'M.Tech in Computer Science & Engineering',
  'M.Tech in Mechatronics',
];

export const YEARS_OF_STUDY = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  'Final Year',
];

export const DASHBOARD_ROUTES = {
  [ROLES.STUDENT]: '/dashboard/student',
  [ROLES.ADMIN]: '/dashboard/admin',
};
