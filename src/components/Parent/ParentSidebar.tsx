import React, { useRef, useMemo } from 'react';
import { Home, LogOut } from 'lucide-react';

interface ParentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const ParentSidebar: React.FC<ParentSidebarProps> = ({ isOpen, onClose, onLogout }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const SidebarContent = useMemo(() => (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      <nav ref={scrollRef} className="flex-1 overflow-y-auto py-4 scroll-smooth scrollbar-hide scrollbar-show-on-hover">
        <div className="px-4 mb-2">
          <button
            onClick={onClose}
            className="w-full flex items-center p-3 rounded-lg transition-colors bg-blue-50 text-blue-600"
          >
            <Home className="w-5 h-5 mr-3" />
            <span className="font-medium">Dashboard</span>
          </button>
        </div>

        <div className="px-4 mt-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center p-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </nav>
    </div>
  ), []);

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 flex transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-black opacity-30" 
          onClick={onClose}
        />
        {/* Sidebar with shadow */}
        <div 
          className={`relative w-64 h-full bg-white transform transition-transform duration-300 ease-in-out shadow-2xl ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {SidebarContent}
        </div>
      </div>
    </>
  );
};

