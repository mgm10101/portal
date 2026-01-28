import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, GraduationCap, KeyRound, LogOut, Menu, Bell, Search, Settings, User, Eye, EyeOff, Loader2, Users, CalendarClock } from 'lucide-react';
import logo from '../../assets/logo.png';
import { supabase } from '../../supabaseClient';

interface HeaderProps {
  onMenuClick: () => void;
  username?: string;
  description?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, username = 'Admin', description }) => {
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [staffCount, setStaffCount] = useState<number | null>(null);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      try {
        const [studentsRes, staffRes] = await Promise.all([
          supabase
            .from('students')
            .select('status'),
          supabase
            .from('staff')
            .select('*', { count: 'exact', head: true })
            .in('status', ['Active', 'On Leave', 'Suspended']),
        ]);

        if (cancelled) return;

        if (!studentsRes.error) {
          const activeStudentsCount = (studentsRes.data || []).filter((s: any) => s.status === 'Active').length;
          setStudentCount(activeStudentsCount);
        }
        if (!staffRes.error) setStaffCount(staffRes.count ?? 0);
      } catch {
        // Silently fail; badges will remain in loading state.
      }
    };

    loadCounts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!showProfileMenu) return;
      const target = e.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showChangePassword) {
        setShowChangePassword(false);
      } else if (showProfileMenu) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showProfileMenu, showChangePassword]);

  const handleLogout = async () => {
    try {
      setShowProfileMenu(false);
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) {
        setPasswordError('User email not found');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError('Current password is incorrect');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setPasswordError(updateError.message || 'Failed to update password');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
      setPasswordError('');
      alert('Password updated successfully!');
    } catch (e: any) {
      setPasswordError(e?.message || 'An unexpected error occurred');
    } finally {
      setChangingPassword(false);
    }
  };

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
          <span className="hidden md:block text-2xl font-medium text-gray-800 mgm-academy-text whitespace-nowrap">MGM Academy</span>

          <div className="hidden md:flex items-center ml-4 gap-3 min-w-0">
            <div className="relative flex-1 min-w-0 w-full max-w-[22rem]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Modules..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 whitespace-nowrap flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Students: {studentCount === null ? '--' : studentCount}</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 whitespace-nowrap flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Staff: {staffCount === null ? '--' : staffCount}</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-100 whitespace-nowrap flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Upcoming Events: 0</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center ml-6">
          <button
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-6 h-6 text-gray-500 stroke-gray-500 stroke-[1]" />
          </button>

          {/* Notification Bell with Badge */}
          <div className="relative">
            <button
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6 text-gray-500 stroke-gray-500 stroke-[1]" />
            </button>
            <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
              5
            </span>
          </div>
          
          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((v) => !v)}
              className="ml-3 relative flex items-center gap-1.5 p-1 pr-7 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Profile"
            >
              <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-blue-200 to-blue-500 flex items-center justify-center border-2 border-blue-100">
                <User className="w-[22px] h-[22px] text-white" />
              </div>

              <div className="hidden md:flex flex-col justify-center items-start text-left h-full py-1">
                <span className="text-base font-medium text-gray-800 leading-none">{username}</span>
                {description && (
                  <span className="text-xs text-gray-500 leading-none mt-0.5">{description}</span>
                )}
              </div>

              <ChevronDown className="hidden md:block absolute right-1 top-1/2 w-5 h-5 text-gray-400 -translate-y-1/2" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowChangePassword(true);
                    setPasswordError('');
                  }}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-gray-500" />
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="text-lg font-semibold text-gray-800">Change Password</div>
              <button
                type="button"
                onClick={() => setShowChangePassword(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={changingPassword}
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter current password"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={changingPassword}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter new password"
                    disabled={changingPassword}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={changingPassword}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Confirm new password"
                    disabled={changingPassword}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={changingPassword}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {passwordError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 pt-0">
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                disabled={changingPassword}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save New Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

