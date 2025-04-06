import React from 'react';

const CircularLoader = () => {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
};

export default CircularLoader;
