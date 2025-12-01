import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import logo from '../assets/logo.png';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLogin: (email: string, userType: 'admin' | 'parent') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const passwordChangePendingRef = useRef(false);

  // Sync ref with state to ensure modal shows
  useEffect(() => {
    if (showPasswordChange) {
      passwordChangePendingRef.current = true;
      console.log('🔵 [LOGIN] useEffect: showPasswordChange is true, setting ref to true');
    }
    // Don't reset ref here - let it persist until password is changed
  }, [showPasswordChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // SIMPLEST POSSIBLE: Just authenticate, then login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message || 'Invalid email or password');
        return;
      }

      if (data?.user) {
        const userId = data.user.id;
        
        console.log('🔵 [LOGIN] User logged in:', {
          userId,
          email: data.user.email,
          password_entered: password
        });
        
        // PRIMARY CHECK: Check database field requires_password_change and status
        // This is the most reliable source of truth
        // Add timeout to prevent hanging
        const queryPromise = supabase
          .from('users')
          .select('requires_password_change, status')
          .eq('id', userId)
          .single();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        );
        
        let userData, userError;
        try {
          const result = await Promise.race([queryPromise, timeoutPromise]);
          userData = (result as any).data;
          userError = (result as any).error;
        } catch (err: any) {
          console.warn('⚠️ [LOGIN] Database query failed or timed out:', err.message);
          userError = { message: err.message };
          userData = null;
        }
        
        console.log('🔵 [LOGIN] Database query result:', { 
          userData, 
          userError, 
          rawValue: userData?.requires_password_change, 
          type: typeof userData?.requires_password_change,
          isTrue: userData?.requires_password_change === true,
          isTruthy: !!userData?.requires_password_change,
          status: userData?.status
        });
        
        // Check if account is inactive
        if (!userError && userData?.status === 'Inactive') {
          console.log('❌ [LOGIN] Account is inactive - login blocked');
          setError('Your account is inactive. Please contact an administrator to activate your account.');
          setLoading(false);
          return;
        }
        
        if (userError) {
          console.warn('⚠️ [LOGIN] Could not check requires_password_change field:', userError.message);
          // If column doesn't exist yet, fall back to password check
          if (password === '0000') {
            console.log('✅ [LOGIN] Password is "0000" - showing password change modal');
            setCurrentUserId(userId);
            setShowPasswordChange(true);
            setLoading(false);
            return;
          }
        } else if (userData?.requires_password_change === true) {
          console.log('✅ [LOGIN] Database flag requires_password_change is TRUE (boolean) - showing password change modal immediately');
          
          // CRITICAL: Set ref FIRST (synchronous, immediate) - this persists across renders
          passwordChangePendingRef.current = true;
          console.log('🔵 [LOGIN] Ref set to true:', passwordChangePendingRef.current);
          
          // Set all state - React will batch these updates
          setCurrentUserId(userId);
          setShowPasswordChange(true);
          setLoading(false);
          
          console.log('🔵 [LOGIN] State updates queued - component will re-render');
          console.log('🔵 [LOGIN] Returning early to prevent login completion');
          
          // IMPORTANT: Don't call onLogin - we need to show modal first
          // The finally block will still run and set loading to false, but that's okay
          return; // Don't proceed with login until password is changed
        } else {
          console.log('🔵 [LOGIN] requires_password_change is not true:', {
            value: userData?.requires_password_change,
            type: typeof userData?.requires_password_change
          });
        }
        
        console.log('✅ [LOGIN] Password change not required (requires_password_change = false), proceeding with login');
        
        // Update last_login timestamp in users table
        const timestamp = new Date().toISOString();
        
        console.log('🔵 [LOGIN] Updating last_login:', {
          userId,
          timestamp,
          email: data.user.email
        });
        
        // First verify the user exists in users table
        const { data: userCheck, error: checkError } = await supabase
          .from('users')
          .select('id, email')
          .eq('id', userId)
          .single();
        
        if (checkError) {
          console.error('❌ [LOGIN] User not found in users table:', checkError);
        } else {
          console.log('✅ [LOGIN] User found in users table:', userCheck);
          
          // Now update last_login
          const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update({ last_login: timestamp })
            .eq('id', userId)
            .select('id, email, last_login');
          
          if (updateError) {
            console.error('❌ [LOGIN] Failed to update last_login:', {
              error: updateError,
              message: updateError.message,
              code: updateError.code,
              details: updateError.details,
              hint: updateError.hint
            });
          } else if (updateData && updateData.length > 0) {
            console.log('✅ [LOGIN] Successfully updated last_login:', updateData[0]);
          } else {
            console.warn('⚠️ [LOGIN] Update returned no data');
          }
        }
        
        // Check user role and selected_modules to determine portal type
        const { data: userRoleData } = await supabase
          .from('users')
          .select('role, selected_modules')
          .eq('id', userId)
          .single();
        
        // Check if user is a Parent or has 'parent portal' in selected_modules
        let userType: 'admin' | 'parent' = 'admin';
        if (userRoleData?.role === 'Parent') {
          userType = 'parent';
        } else if (userRoleData?.selected_modules) {
          try {
            const modules = typeof userRoleData.selected_modules === 'string'
              ? JSON.parse(userRoleData.selected_modules)
              : userRoleData.selected_modules;
            if (Array.isArray(modules)) {
              const hasParentPortal = modules.some((m: any) => 
                m.label === 'Parent Portal' || m.module === 'Parent Portal' || m.id === 'parent-portal'
              );
              if (hasParentPortal) {
                userType = 'parent';
              }
            }
          } catch (err) {
            console.error('Error parsing selected_modules:', err);
          }
        }
        
        // Success! Call onLogin with determined type
        onLogin(email, userType);
      } else {
        setError('Login failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      // Only set loading to false if we're not showing password change modal
      // If password change is required, we already set loading to false
      if (!passwordChangePendingRef.current) {
        setLoading(false);
      }
    }
  };

  const handlePasswordChange = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please enter both new password and confirmation');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setChangingPassword(true);
    
    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          requires_password_change: false // Clear the metadata flag
        }
      });
      
      if (updateError) {
        setPasswordError(updateError.message || 'Failed to update password');
        return;
      }
      
      console.log('✅ [PASSWORD_CHANGE] Password updated successfully');
      
      // Update the database flag to false after successful password change
      if (currentUserId) {
        const { error: dbUpdateError } = await supabase
          .from('users')
          .update({ requires_password_change: false })
          .eq('id', currentUserId);
        
        if (dbUpdateError) {
          console.error('❌ [PASSWORD_CHANGE] Failed to update requires_password_change flag:', dbUpdateError);
          setPasswordError('Password changed but failed to update status. Please contact administrator.');
          return;
        }
        
        console.log('✅ [PASSWORD_CHANGE] Successfully updated requires_password_change to false');
      }
      
      // Reset ref and state
      passwordChangePendingRef.current = false;
      
      // Password updated successfully, now complete the login
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
      
      // Update last_login and proceed with login
      // Get the current user's email from auth to ensure we have the correct email
      let userEmail = email;
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          userEmail = authUser.email;
        }
      } catch (err) {
        console.error('Failed to get auth user email:', err);
      }
      
      if (currentUserId) {
        const timestamp = new Date().toISOString();
        await supabase
          .from('users')
          .update({ last_login: timestamp })
          .eq('id', currentUserId)
          .catch(err => console.error('Failed to update last login:', err));
      }
      
      onLogin(userEmail, 'admin');
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmPassword, currentUserId, onLogin]);

  // Memoize event handlers to prevent re-creation on every render
  const handleNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
  }, []);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  }, []);

  const handleToggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Memoize the modal component to prevent unnecessary re-renders
  const PasswordChangeModal = useMemo(() => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 99999, position: 'fixed' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative" style={{ zIndex: 100000 }}>
          <div className="text-center mb-6">
            <img 
              src={logo}
              alt="MGM Academy Logo"
              className="w-[105px] sm:w-[115px] md:w-[126px] mx-auto mb-4 rounded-lg"
            />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Change Your Password</h2>
            <p className="text-gray-600 text-sm">Please change your default password before proceeding</p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  key="new-password-input"
                  type={showPassword ? 'text' : 'password'}
                  id="new-password"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                  disabled={changingPassword}
                  minLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleToggleShowPassword}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  key="confirm-password-input"
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  required
                  disabled={changingPassword}
                  minLength={6}
                />
              </div>
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }, [newPassword, confirmPassword, showPassword, passwordError, changingPassword, handlePasswordChange, handleNewPasswordChange, handleConfirmPasswordChange, handleToggleShowPassword]);

  const ForgotPasswordForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
        <p className="text-gray-600">Enter your email address and we'll send you a reset link</p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Send Reset Link
        </button>

        <button
          type="button"
          onClick={() => setShowForgotPassword(false)}
          className="w-full text-blue-600 hover:text-blue-700 text-sm"
        >
          Back to Login
        </button>
      </form>
    </div>
  );

  // Show password change modal if needed (non-dismissible)
  // Check both state and ref to ensure modal shows
  // CRITICAL: Check ref FIRST - it persists even if state hasn't updated yet
  // The ref is set synchronously, so it's available immediately
  const refValue = passwordChangePendingRef.current;
  
  // If ref is true, render modal immediately (don't wait for state)
  if (refValue === true) {
    // Sync state if needed (but don't wait for it)
    if (!showPasswordChange) {
      setShowPasswordChange(true);
    }
    return <>{PasswordChangeModal}</>;
  }
  
  // Also check state as fallback
  if (showPasswordChange === true) {
    return <>{PasswordChangeModal}</>;
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src={logo}
              alt="MGM Academy Logo"
              className="w-[105px] sm:w-[115px] md:w-[126px] mx-auto mb-4 rounded-lg"
            />
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src={logo}
            alt="MGM Academy Logo"
            className="w-[105px] sm:w-[115px] md:w-[126px] mx-auto mb-4 rounded-lg"
          />
          <h1 className="text-2xl font-medium text-gray-800 mb-2">MGM Academy</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                id="login-email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
