import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Construction } from 'lucide-react';

const ApplicationsPlaceholder = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6"
    >
      <div className="h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
        <FileText className="h-10 w-10" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">My Applications</h1>
      <p className="text-neutral-500 max-w-md mb-8">
        This section will track all your job applications, shortlist status, and interview schedules.
      </p>
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-100">
        <Construction className="h-4 w-4" />
        Feature Under Development
      </div>
    </motion.div>
  );
};

export default ApplicationsPlaceholder;
