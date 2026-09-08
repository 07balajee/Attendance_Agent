import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="w-full animate-pulse divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 py-3.5 px-4">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`h-4 rounded bg-slate-200/70 ${
                cIdx === 0 ? 'w-36' : cIdx === 1 ? 'w-24' : 'w-20'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
