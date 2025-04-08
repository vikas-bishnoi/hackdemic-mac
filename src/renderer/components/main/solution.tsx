import React, { useEffect, useRef } from 'react';

const Solution = ({ solution }: { solution: string }) => {
  const rootRef = useRef(null);

  const handleMouseDown = () => {
    rootRef.current?.classList.remove('no-drag');
  };

  const handleMouseUp = () => {
    rootRef.current?.classList.add('no-drag');
  };

  return (
    <div
      className="text-white w-full h-full text-start no-scrollbar"
      ref={rootRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <pre className="content select-none text-sm max-h-full overflow-y-auto whitespace-pre-wrap break-words no-scrollbar no-drag rounded-lg p-4 hover:no-underline">
        <code onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
          {solution}
        </code>
      </pre>
    </div>
  );
};

export default Solution;
