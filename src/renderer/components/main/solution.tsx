import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

function Solution({ solution }: { solution: string }) {
  return (
    <div
      className={cn(
        'text-yellow-300 w-full h-full  text-start no-scrollbar hover:no-underline ',
      )}
    >
      <pre className="content select-none text-sm max-h-full overflow-y-auto whitespace-pre-wrap break-words no-scrollbar rounded-lg p-4 hover:no-underline">
        <code className="hover:no-underline hover:text-yellow-300">
          {solution}
        </code>
      </pre>
    </div>
  );
}

export default Solution;
