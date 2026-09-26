import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RouteLoading from '../components/common/RouteLoading';

// Auth pages (lazy-loaded)
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const AdminLoginPage = lazy(() => import('../pages/auth/AdminLoginPage'));
const AdminChangePasswordPage = lazy(() => import('../pages/auth/AdminChangePasswordPage'));

// Student Dashboard pages (lazy-loaded)
const StudentDashboard = lazy(() => import('../pages/dashboard/StudentDashboard'));
const StudentDashboardHome = lazy(() => import('../pages/dashboard/StudentDashboardHome'));
const StudentProfilePage = lazy(() => import('../pages/dashboard/StudentProfilePage'));
const DrivesPage = lazy(() => import('../pages/dashboard/DrivesPage'));
const DriveDetail = lazy(() => import('../pages/dashboard/DriveDetail'));
const ApplicationsPage = lazy(() => import('../pages/dashboard/ApplicationsPage'));
const NoticesPage = lazy(() => import('../pages/dashboard/NoticesPage'));

// Admin Dashboard pages (lazy-loaded)
const AdminDashboard = lazy(() => import('../pages/dashboard/AdminDashboard'));
const AdminOverview = lazy(() => import('../pages/dashboard/admin/AdminOverview'));
const StudentDirectory = lazy(() => import('../pages/dashboard/admin/StudentDirectory'));
const AdminNoticesPage = lazy(() => import('../pages/dashboard/admin/AdminNoticesPage'));
const AdminDrivesPage = lazy(() => import('../pages/dashboard/admin/AdminDrivesPage'));
const DriveApplicationsPage = lazy(() => import('../pages/dashboard/admin/DriveApplicationsPage'));

// Route guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import PublicRoute from './PublicRoute';

import { ROLES } from '../constants/roles';

const AppRouter = () => {
  return (
    <Suspense fallback={<RouteLoading fullScreen />}>
      <Routes>
        {/* Public auth routes */}
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/admin/login"
          element={
            <PublicRoute>
              <AdminLoginPage />
            </PublicRoute>
          }
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route
          path="/admin/change-password"
          element={
            <ProtectedRoute>
              <AdminChangePasswordPage />
            </ProtectedRoute>
          }
        />

        {/* Protected dashboard routes */}
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                <StudentDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboardHome />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="drives" element={<DrivesPage />} />
          <Route path="drives/:id" element={<DriveDetail />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="notices" element={<NoticesPage />} />
        </Route>
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          {/* Placeholder routes for other admin features */}
          <Route path="students" element={<StudentDirectory />} />
          <Route path="drives" element={<AdminDrivesPage />} />
          <Route path="drives/:id/applications" element={<DriveApplicationsPage />} />
          <Route path="notices" element={<AdminNoticesPage />} />
          <Route path="settings" element={<div className="p-8 text-center">Admin Settings — Coming Soon</div>} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
