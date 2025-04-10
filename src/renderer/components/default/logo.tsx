import React from 'react';
import { cn } from '../../lib/utils';

const Logo = ({ classNames }: { classNames?: string }) => {
  return (
    <span className={cn('text-2xl font-bold text-black', classNames)}>
      Hack<span className="text-orange-500">demic</span>
    </span>
  );
};

export default Logo;
