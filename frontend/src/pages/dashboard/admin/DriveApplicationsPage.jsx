import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDriveApplications, updateBulkApplicationStatus } from '../../../api/applicationApi';
import { Download, Search, ArrowLeft, GraduationCap, Building2, ExternalLink, Loader2, X, Check } from 'lucide-react';
import ApplicationStatusManager from './components/ApplicationStatusManager';
import { toast } from 'react-hot-toast';

// Lazy load AnalyticsDashboard to prevent import errors from crashing the whole page
const AnalyticsDashboard = React.lazy(() => import('./components/AnalyticsDashboard'));

// Simple error boundary to catch rendering errors
class AnalyticsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('AnalyticsDashboard Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-600 font-semibold text-lg mb-2">Failed to load Analytics</p>
          <p className="text-red-500 text-sm mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const downloadResumeAs = async (url, usn, fullName) => {
  const firstName = (fullName || 'Student').split(' ')[0];
  const filename = `${usn || 'UNKNOWN'}-${firstName}.pdf`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Fetch failed');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback: open in new tab if strict CORS blocks blob fetch
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

const exportToCSV = (applications, driveName) => {
  if (!applications || !applications.length) {
    toast.error('No applications to export');
    return;
  }

  const headers = ['Name', 'Email', 'Roll Number', 'Branch', 'CGPA', 'Backlogs', 'Status', 'Applied At', 'Resume URL'];
  const rows = applications.map(app => [
    app.studentId?.name || 'N/A',
    app.studentId?.email || 'N/A',
    app.studentId?.rollNumber || 'N/A',
    app.studentProfile?.department || app.studentId?.department || 'N/A',
    app.studentProfile?.cgpa || 'N/A',
    app.studentProfile?.backlogs || '0',
    app.status,
    new Date(app.appliedAt).toLocaleDateString(),
    app.resumeSnapshot || app.studentProfile?.resumeUrl || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const safeDriveName = (driveName || 'Drive').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute('download', `${safeDriveName}_applications.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const DriveApplicationsPage = () => {
  const { id } = useParams();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'appliedAt', direction: 'desc' });
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'analytics'
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [bulkStatusToApply, setBulkStatusToApply] = useState('shortlisted');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const statuses = [
    { value: 'applied', label: 'Applied' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'not-shortlisted', label: 'Not Shortlisted' },
    { value: 'test-cleared', label: 'Test Cleared' },
    { value: 'test-failed', label: 'Test Failed' },
    { value: 'interview-scheduled', label: 'Interview Scheduled' },
    { value: 'selected', label: 'Selected' },
    { value: 'rejected', label: 'Rejected' },
  ];

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        const res = await getDriveApplications(id);
        if (res.success) {
          setApplications(res.data);
        }
      } catch (error) {
        toast.error('Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchApplications();
  }, [id]);

  const handleStatusUpdateLocally = (appId, newStatus) => {
    setApplications(prev => prev.map(app => 
      app._id === appId ? { ...app, status: newStatus } : app
    ));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAppIds(filteredAndSortedApps.map(app => app._id));
    } else {
      setSelectedAppIds([]);
    }
  };

  const handleSelectOne = (appId) => {
    setSelectedAppIds(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedAppIds.length === 0) return;
    try {
      setIsBulkUpdating(true);
      await updateBulkApplicationStatus(selectedAppIds, bulkStatusToApply);
      
      setApplications(prev => prev.map(app => 
        selectedAppIds.includes(app._id) ? { ...app, status: bulkStatusToApply } : app
      ));
      
      toast.success(`Successfully updated ${selectedAppIds.length} applications`);
      setIsBulkStatusModalOpen(false);
      setSelectedAppIds([]);
    } catch (error) {
      toast.error('Failed to update applications');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const filteredAndSortedApps = useMemo(() => {
    let result = [...applications];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(app => 
        app.studentId?.name?.toLowerCase().includes(q) ||
        app.studentId?.rollNumber?.toLowerCase().includes(q) ||
        app.studentId?.department?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name':
          aVal = a.studentId?.name || '';
          bVal = b.studentId?.name || '';
          break;
        case 'cgpa':
          aVal = a.studentProfile?.cgpa || 0;
          bVal = b.studentProfile?.cgpa || 0;
          break;
        case 'appliedAt':
          aVal = new Date(a.appliedAt).getTime();
          bVal = new Date(b.appliedAt).getTime();
          break;
        default:
          aVal = 0; bVal = 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [applications, searchQuery, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-500">Loading applications...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link to="/dashboard/admin/drives" className="inline-flex items-center text-neutral-500 hover:text-brand-blue mb-4 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Drives
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Applications</h1>
            <p className="text-neutral-500 mt-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Drive ID: {id} • <GraduationCap className="w-4 h-4 ml-2" /> {applications.length} Total Applicants
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-neutral-100 p-1 rounded-xl inline-flex">
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'applications'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Applications
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Analytics
              </button>
            </div>
            {activeTab === 'applications' && (
              <button
                onClick={() => exportToCSV(filteredAndSortedApps, `Drive_${id}`)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <AnalyticsErrorBoundary>
          <Suspense fallback={
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          }>
            <AnalyticsDashboard driveId={id} />
          </Suspense>
        </AnalyticsErrorBoundary>
      ) : (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, or branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border-neutral-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>
          {selectedAppIds.length > 0 && (
            <div className="flex items-center gap-4 bg-brand-blue/10 px-4 py-2 rounded-xl border border-brand-blue/20">
              <span className="text-sm font-semibold text-brand-blue">
                {selectedAppIds.length} selected
              </span>
              <button
                onClick={() => setIsBulkStatusModalOpen(true)}
                className="px-4 py-1.5 bg-brand-blue text-white text-sm font-medium rounded-lg hover:bg-brand-blue/90 transition-colors"
              >
                Change Status
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600">
            <thead className="text-xs uppercase bg-neutral-50/80 text-neutral-500 font-semibold border-b border-neutral-100">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-neutral-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                    checked={filteredAndSortedApps.length > 0 && selectedAppIds.length === filteredAndSortedApps.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-brand-blue" onClick={() => requestSort('name')}>
                  Applicant {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 cursor-pointer hover:text-brand-blue" onClick={() => requestSort('cgpa')}>
                  Academics {sortConfig.key === 'cgpa' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-brand-blue" onClick={() => requestSort('appliedAt')}>
                  Applied Date {sortConfig.key === 'appliedAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4">Resume</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100/80">
              {filteredAndSortedApps.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-neutral-400">
                    No applicants found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredAndSortedApps.map((app) => (
                  <tr key={app._id} className={`hover:bg-neutral-50/50 transition-colors group ${selectedAppIds.includes(app._id) ? 'bg-brand-blue/5' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-neutral-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                        checked={selectedAppIds.includes(app._id)}
                        onChange={() => handleSelectOne(app._id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900">{app.studentId?.name || 'Unknown'}</div>
                      <div className="text-xs text-neutral-500 font-medium mt-0.5">{app.studentId?.rollNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-neutral-600">{app.studentId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-neutral-800">{app.studentProfile?.cgpa || 'N/A'} CGPA</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{app.studentProfile?.department || app.studentId?.department || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(app.appliedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {(app.resumeSnapshot || app.studentProfile?.resumeUrl) ? (
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={app.resumeSnapshot || app.studentProfile?.resumeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-brand-blue hover:text-white transition-colors"
                            title="View Resume"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() =>
                              downloadResumeAs(
                                app.resumeSnapshot || app.studentProfile?.resumeUrl,
                                app.studentId?.rollNumber,
                                app.studentId?.name
                              )
                            }
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-indigo-600 hover:text-white transition-colors"
                            title={`Download as ${app.studentId?.rollNumber}-${(app.studentId?.name || '').split(' ')[0]}.pdf`}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ApplicationStatusManager application={app} onStatusChange={handleStatusUpdateLocally} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
      {/* Bulk Status Update Modal */}
      {isBulkStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">Update Status for {selectedAppIds.length} Students</h3>
              <button 
                onClick={() => setIsBulkStatusModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Selected Students:</label>
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                  <ul className="space-y-1">
                    {applications.filter(app => selectedAppIds.includes(app._id)).map(app => (
                      <li key={app._id} className="text-sm text-neutral-600 flex justify-between">
                        <span className="font-medium">{app.studentId?.name || 'Unknown'}</span>
                        <span className="text-neutral-400 text-xs">{app.studentId?.rollNumber}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">New Status:</label>
                <select
                  value={bulkStatusToApply}
                  onChange={(e) => setBulkStatusToApply(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-colors"
                >
                  {statuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-5 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
              <button
                onClick={() => setIsBulkStatusModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={isBulkUpdating}
                className="px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded-xl hover:bg-brand-blue/90 transition-colors flex items-center disabled:opacity-50"
              >
                {isBulkUpdating ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Confirm Update</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriveApplicationsPage;
