import React from 'react';
import { cn } from '@/lib/utils';

function CircularLoader({ classNames }: any) {
  return (
    <div
      className={cn(
        'w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin',
        classNames,
      )}
    />
  );
}

export default CircularLoader;
