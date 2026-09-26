import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info' | 'danger' | 'warning' | 'success'
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    resolve: null,
  });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title || 'Are you sure?',
        message: options.message || '',
        type: options.type || 'info',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState]);

  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState]);

  // Handle Escape key to close the dialog
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && dialogState.isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogState.isOpen, handleClose]);

  // Get icon and color scheme based on dialog type
  const getTypeStyles = () => {
    switch (dialogState.type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-red-600 md:w-8 md:h-8" />,
          iconBg: 'bg-red-50 text-red-600',
          confirmButtonBg: 'bg-red-600 hover:bg-red-700 shadow-red-600/20 focus:ring-red-500',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600 md:w-8 md:h-8" />,
          iconBg: 'bg-amber-50 text-amber-600',
          confirmButtonBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 focus:ring-amber-500',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-green-600 md:w-8 md:h-8" />,
          iconBg: 'bg-green-50 text-green-600',
          confirmButtonBg: 'bg-green-600 hover:bg-green-700 shadow-green-600/20 focus:ring-green-500',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-6 h-6 text-blue-600 md:w-8 md:h-8" />,
          iconBg: 'bg-blue-50 text-blue-600',
          confirmButtonBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 focus:ring-blue-500',
        };
    }
  };

  const { icon, iconBg, confirmButtonBg } = getTypeStyles();

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <AnimatePresence>
        {dialogState.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-[2px] transition-all"
            />

            {/* Modal Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-[420px] overflow-hidden p-6 md:p-8 flex flex-col items-center text-center z-10 select-none border border-neutral-100"
            >
              {/* Close button top right */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors duration-200 outline-none"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Icon Container */}
              <div className={`w-12 h-12 md:w-16 md:h-16 ${iconBg} rounded-full flex items-center justify-center mb-5 md:mb-6`}>
                {icon}
              </div>

              {/* Dialog Title */}
              <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 mb-2.5 tracking-tight px-2 leading-tight">
                {dialogState.title}
              </h2>

              {/* Dialog Message */}
              <p className="text-neutral-500 text-sm md:text-base mb-6 md:mb-8 leading-relaxed max-w-sm px-1">
                {dialogState.message}
              </p>

              {/* Responsive Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                <button
                  onClick={handleClose}
                  className="w-full sm:flex-1 py-3 px-5 rounded-xl text-sm md:text-base font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200/90 hover:text-neutral-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                >
                  {dialogState.cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`w-full sm:flex-1 py-3 px-5 rounded-xl text-sm md:text-base font-bold text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonBg}`}
                >
                  {dialogState.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
