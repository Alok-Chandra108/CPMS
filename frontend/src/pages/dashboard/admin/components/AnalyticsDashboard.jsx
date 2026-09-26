import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../../api/adminApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { exportToCSV, exportToPDF } from '../../../../utils/exportUtils';
import { Download, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

const AnalyticsDashboard = ({ driveId }) => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const res = await adminApi.getDriveReport(driveId);
        if (res.success) {
          setReportData(res.data);
        }
      } catch (error) {
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    if (driveId) {
      fetchReport();
    }
  }, [driveId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!reportData) {
    return <div className="text-center p-8 text-neutral-500">No data available.</div>;
  }

  const statusCounts = reportData.statusCounts || {};
  const totalApplications = reportData.totalApplications || 0;
  const drive = reportData.drive || {};

  // Format data for Recharts
  const barData = Object.keys(statusCounts).map(status => ({
    name: status.replace('-', ' ').toUpperCase(),
    count: statusCounts[status] || 0
  }));

  // For Funnel, we can show a simplified progression
  const funnelData = [
    { name: 'Applied', value: statusCounts['applied'] || 0 },
    { name: 'Shortlisted', value: statusCounts['shortlisted'] || 0 },
    { name: 'Interviewed', value: statusCounts['interview-scheduled'] || 0 },
    { name: 'Hired', value: statusCounts['selected'] || 0 },
  ];

  const handleExportCSV = () => {
    const dataToExport = [
      { Metric: 'Total Applications', Value: totalApplications },
      ...Object.keys(statusCounts).map(status => ({
        Metric: status.replace('-', ' ').toUpperCase(),
        Value: statusCounts[status]
      }))
    ];
    exportToCSV(dataToExport, `${drive?.companyName}_analytics.csv`);
  };

  const handleExportPDF = () => {
    const dataToExport = [
      { Metric: 'Total Applications', Value: totalApplications },
      ...Object.keys(statusCounts).map(status => ({
        Metric: status.replace('-', ' ').toUpperCase(),
        Value: statusCounts[status]
      }))
    ];
    exportToPDF(dataToExport, `${drive?.companyName} Drive Report`, `${drive?.companyName}_report.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Analytics Overview</h2>
          <p className="text-sm text-neutral-500">Visualizing application progression and metrics</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-200 transition-colors"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <FileText className="w-4 h-4" /> PDF Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
          <p className="text-sm font-medium text-neutral-500 mb-1">Total Applied</p>
          <p className="text-3xl font-extrabold text-neutral-900">{totalApplications}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
          <p className="text-sm font-medium text-neutral-500 mb-1">Shortlisted</p>
          <p className="text-3xl font-extrabold text-brand-blue">{statusCounts['shortlisted'] || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
          <p className="text-sm font-medium text-neutral-500 mb-1">Interviewed</p>
          <p className="text-3xl font-extrabold text-purple-600">{statusCounts['interview-scheduled'] || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
          <p className="text-sm font-medium text-neutral-500 mb-1">Selected/Hired</p>
          <p className="text-3xl font-extrabold text-green-600">{statusCounts['selected'] || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
          <h3 className="text-base font-bold text-neutral-900 mb-6">Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} angle={-45} textAnchor="end" />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel / Conversion */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
          <h3 className="text-base font-bold text-neutral-900 mb-6">Conversion Funnel</h3>
          <div className="h-80 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={funnelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
