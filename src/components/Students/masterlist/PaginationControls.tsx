// src/components/students/masterlist/PaginationControls.tsx

import React from 'react';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  totalPages,
  totalRecords,
  onPageChange,
}) => {
  const startRecord = page * 50 + 1;
  const endRecord = Math.min((page + 1) * 50, totalRecords);

  return (
    <div className="flex justify-between items-center my-4 px-4 py-3 bg-white rounded-lg border border-gray-200">
      <div className="text-sm text-gray-600">
        Showing {startRecord} to {endRecord} of {totalRecords} students
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className={`px-4 py-2 border rounded-lg ${
            page === 0
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => {
            // Show first page, last page, current page, and pages around current
            const showPage = 
              pageNum === 0 || 
              pageNum === totalPages - 1 || 
              (pageNum >= page - 1 && pageNum <= page + 1) ||
              (page === 0 && pageNum <= 2) ||
              (page === totalPages - 1 && pageNum >= totalPages - 3);
            
            if (!showPage) {
              // Show ellipsis
              if (pageNum === page - 2 || pageNum === page + 2) {
                return (
                  <span key={pageNum} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-2 border rounded-lg ${
                  pageNum === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className={`px-4 py-2 border rounded-lg ${
            page >= totalPages - 1
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};
