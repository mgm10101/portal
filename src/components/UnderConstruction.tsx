import React from 'react';
import { Cog } from 'lucide-react';

export const UnderConstruction: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <Cog className="w-16 h-16 text-gray-400 animate-spin" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Under Construction</h2>
        <p className="text-gray-500">This page is currently being developed.</p>
      </div>
    </div>
  );
};

