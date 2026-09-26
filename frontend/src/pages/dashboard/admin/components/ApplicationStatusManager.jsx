import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { updateApplicationStatus } from '../../../../api/applicationApi';
import { Edit2, AlertTriangle, Check, X } from 'lucide-react';

const statuses = [
  { value: 'applied',              label: 'Applied',              color: 'bg-neutral-100 text-neutral-600' },
  { value: 'shortlisted',          label: 'Shortlisted',          color: 'bg-blue-50 text-blue-600' },
  { value: 'not-shortlisted',      label: 'Not Shortlisted',      color: 'bg-red-50 text-red-600' },
  { value: 'test-cleared',         label: 'Test Cleared',         color: 'bg-green-50 text-green-600' },
  { value: 'test-failed',          label: 'Test Failed',          color: 'bg-red-50 text-red-600' },
  { value: 'interview-scheduled',  label: 'Interview Scheduled',  color: 'bg-purple-50 text-purple-600' },
  { value: 'selected',             label: 'Selected',             color: 'bg-brand-orange/10 text-brand-orange' },
  { value: 'rejected',             label: 'Rejected',             color: 'bg-red-50 text-red-600' },
];

const ApplicationStatusManager = ({ application, onStatusChange }) => {
  // Track selected value locally — avoids the stale-prop reset bug on error
  const [selectedStatus, setSelectedStatus] = useState(application.status);
  const [isUpdating, setIsUpdating] = useState(false);
  // Pending status awaiting confirmation
  const [pendingStatus, setPendingStatus] = useState(null);

  const currentStatusConfig = statuses.find(s => s.value === selectedStatus) || statuses[0];

  const handleSelectChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus === selectedStatus) return;
    // Stage the change; wait for confirm
    setPendingStatus(newStatus);
  };

  const confirmChange = async () => {
    if (!pendingStatus) return;
    const newStatus = pendingStatus;
    setPendingStatus(null);

    try {
      setIsUpdating(true);
      await updateApplicationStatus(application._id, { status: newStatus });
      setSelectedStatus(newStatus);
      toast.success(`Status updated to "${statuses.find(s => s.value === newStatus)?.label || newStatus}"`);
      if (onStatusChange) {
        onStatusChange(application._id, newStatus);
      }
    } catch {
      toast.error('Failed to update status');
      // selectedStatus stays at the old value — no stale-prop issue
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelChange = () => setPendingStatus(null);

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Inline confirmation prompt */}
      {pendingStatus && !isUpdating && (
        <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-amber-700 font-medium whitespace-nowrap">
            Change to <strong>{statuses.find(s => s.value === pendingStatus)?.label}</strong>?
          </span>
          <button
            onClick={confirmChange}
            className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            title="Confirm"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={cancelChange}
            className="p-1 rounded bg-neutral-200 text-neutral-600 hover:bg-neutral-300 transition-colors"
            title="Cancel"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Status select */}
      <div className="relative inline-block w-48">
        <select
          value={selectedStatus}
          onChange={handleSelectChange}
          disabled={isUpdating || !!pendingStatus}
          className={`w-full appearance-none rounded-lg border border-neutral-200 pl-4 pr-10 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-colors disabled:opacity-50 cursor-pointer ${currentStatusConfig.color}`}
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value} className="bg-white text-neutral-900">
              {status.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
          {isUpdating ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <Edit2 className="h-4 w-4" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatusManager;
