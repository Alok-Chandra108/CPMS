import React from 'react';
import { Loader2 } from 'lucide-react';

const RouteLoading = ({ fullScreen = false, message = 'Loading...' }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center transition-opacity duration-200 ${
        fullScreen ? 'min-h-screen bg-gray-50' : 'w-full py-20 min-h-[50vh]'
      }`}
    >
      <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
      <p className="text-gray-500 text-sm font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default RouteLoading;
