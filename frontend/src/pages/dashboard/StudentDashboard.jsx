import React, { Suspense, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import RouteLoading from '../../components/common/RouteLoading';
import { fetchProfile } from '../../features/profile/profileThunks';
import { getNotices, fetchReadNotices } from '../../features/notices/noticeSlice';

const StudentDashboard = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(getNotices({ limit: 10 }));
    dispatch(fetchReadNotices());
  }, [dispatch]);

  return (
    <DashboardLayout>
      <Suspense fallback={<RouteLoading message="Loading dashboard section..." />}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
};

export default StudentDashboard;
