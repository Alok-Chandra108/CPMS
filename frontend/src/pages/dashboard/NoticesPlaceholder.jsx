import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Construction } from 'lucide-react';

const NoticesPlaceholder = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6"
    >
      <div className="h-20 w-20 rounded-3xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-6">
        <Bell className="h-10 w-10" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Notice Board</h1>
      <p className="text-neutral-500 max-w-md mb-8">
        Stay updated with the latest announcements, guest lectures, and placement news from the TPO cell.
      </p>
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-100">
        <Construction className="h-4 w-4" />
        Feature Under Development
      </div>
    </motion.div>
  );
};

export default NoticesPlaceholder;
