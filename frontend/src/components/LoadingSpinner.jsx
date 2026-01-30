import React from 'react';

const LoadingSpinner = ({ message = "Loading dashboard data..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-90">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#2953CD] rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-[#2953CD] rounded-full animate-spin animation-delay-150"></div>
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <p className="text-lg font-semibold text-[#2953CD] mb-2">{message}</p>
          <p className="text-sm text-gray-600">Please wait while we prepare your dashboard</p>
        </div>
        
        {/* Progress dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-[#2953CD] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[#2953CD] rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-2 h-2 bg-[#2953CD] rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;