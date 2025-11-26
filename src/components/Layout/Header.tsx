import React from 'react';
import { Menu, Bell, UserCircle } from 'lucide-react';
import logo from '../../assets/logo.png';

interface HeaderProps {
  onMenuClick: () => void;
  username?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, username = 'Admin' }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-md">
      <div className="h-16 flex items-center justify-between px-6 md:pl-1 md:pr-6">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="mr-2.5 md:mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <img
            src={logo}
            alt="MGM Academy Logo"
            className="h-12 w-auto mr-3 rounded"
          />
          <span className="hidden md:block text-2xl font-medium text-gray-800">MGM Academy</span>
        </div>
        
        <div className="flex items-center">
          {/* Notification Bell with Badge */}
          <div className="relative">
            <button
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-8 h-8 text-gray-600 stroke-[1]" />
            </button>
            <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
              5
            </span>
          </div>
          
          {/* Profile Icon */}
          <button
            className="p-0.5 hover:bg-gray-100 rounded-full transition-colors ml-4"
            aria-label="Profile"
          >
            <UserCircle className="w-[42px] h-[42px] text-gray-600 stroke-[1]" />
          </button>
          
          {/* Username Text */}
          <span className="hidden md:block text-xl font-medium text-gray-800 ml-2">{username}</span>
        </div>
      </div>
    </header>
  );
};

