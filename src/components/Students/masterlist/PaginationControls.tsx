// src/components/students/masterlist/PaginationControls.tsx

import React from 'react';

interface PaginationControlsProps {
  page: number;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  hasMore,
  onPrev,
  onNext,
}) => {
  return (
    <div className="flex justify-end space-x-2 my-4">
      <button
        onClick={onPrev}
        disabled={page === 0}
        className={`px-4 py-2 border rounded-lg ${
          page === 0
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Prev
      </button>
      <button
        onClick={onNext}
        disabled={!hasMore}
        className={`px-4 py-2 border rounded-lg ${
          !hasMore
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Next
      </button>
    </div>
  );
};
