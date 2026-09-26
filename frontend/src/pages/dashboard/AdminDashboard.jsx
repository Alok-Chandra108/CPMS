import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import RouteLoading from '../../components/common/RouteLoading';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Suspense fallback={<RouteLoading message="Loading admin section..." />}>
        <Outlet />
      </Suspense>
    </AdminLayout>
  );
};

export default AdminDashboard;

