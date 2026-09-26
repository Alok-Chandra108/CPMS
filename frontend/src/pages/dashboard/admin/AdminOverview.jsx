import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Briefcase, GraduationCap, Clock, Megaphone, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { getDashboardStats } from '../../../services/admin.service';

const AdminOverview = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardStats();
        if (data.success) {
          setDashboardStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    { label: 'Total Students', value: dashboardStats?.totalStudents ?? 0, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue-light' },
    { label: 'Active Drives', value: dashboardStats?.activeDrives ?? 0, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Placed Students', value: dashboardStats?.placedStudents ?? 0, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending Applications', value: dashboardStats?.pendingApplications ?? 0, icon: Clock, color: 'text-brand-orange', bg: 'bg-brand-orange-light' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Welcome Super Admin</h1>
        <p className="text-neutral-500 mt-1">
          Hello {user?.fullName?.split(' ')[0] || 'Admin'}, here is what's happening in the placement cell today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div>
              {isLoading ? (
                <div className="h-9 w-16 bg-neutral-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
              )}
              <p className="text-sm font-medium text-neutral-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-brand-blue" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/dashboard/admin/drives" className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:border-brand-blue/30 hover:bg-brand-blue/5 transition-all group">
            <div className="flex items-center">
              <div className="p-2 bg-brand-blue-light text-brand-blue rounded-lg mr-3">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="font-medium text-neutral-700 group-hover:text-brand-blue transition-colors">Manage Drives</span>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-brand-blue transition-colors" />
          </Link>
          
          <Link to="/dashboard/admin/students" className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:border-emerald-600/30 hover:bg-emerald-50 transition-all group">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mr-3">
                <Users className="h-5 w-5" />
              </div>
              <span className="font-medium text-neutral-700 group-hover:text-emerald-600 transition-colors">Student Directory</span>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
          </Link>

          <Link to="/dashboard/admin/notices" className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:border-brand-orange/30 hover:bg-brand-orange-light transition-all group">
            <div className="flex items-center">
              <div className="p-2 bg-brand-orange-light text-brand-orange rounded-lg mr-3">
                <Megaphone className="h-5 w-5" />
              </div>
              <span className="font-medium text-neutral-700 group-hover:text-brand-orange transition-colors">Notice Board</span>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-brand-orange transition-colors" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminOverview;
