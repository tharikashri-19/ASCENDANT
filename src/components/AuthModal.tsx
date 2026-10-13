import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useGradence } from '../context/GradenceContext';
import { X, Lock, Mail, User, School, Sparkles, AlertCircle, CheckCircle, LogIn, UserPlus, UserX, AlertTriangle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, signOut, refreshData, deleteAccount } = useGradence();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || 'Student',
              university: university || 'General University'
            }
          }
        });

        if (error) throw error;

        if (data?.session) {
          setSuccessMsg('Account created successfully! Syncing your data...');
          await refreshData();
          setTimeout(() => onClose(), 1000);
        } else {
          setSuccessMsg('Sign up successful! Please check your email to confirm your account.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        setSuccessMsg('Logged in successfully! Loading your records...');
        await refreshData();
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      setSuccessMsg('Signed out successfully.');
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign out failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteAccount();
      setSuccessMsg('Account deleted successfully.');
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Account deletion failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl bg-[#FAF6EE] text-[#2C221E] shadow-2xl border border-[#B7A89A]/40 dark:bg-[#1E1617] dark:text-[#FAF6EE] dark:border-[#722f37]/50">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#B7A89A]/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#722f37]/10 text-[#722f37] dark:bg-[#722f37]/30 dark:text-[#FAF6EE]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-[#722f37] dark:text-[#FAF6EE]">
                {user ? 'Account & Cloud Sync' : (isSignUp ? 'Create Student Account' : 'Sign In to ASCENDANT')}
              </h3>
              <p className="text-xs text-[#722f37]/70 dark:text-[#FAF6EE]/70">
                Powered by Supabase PostgreSQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#722f37]/70 hover:bg-[#722f37]/10 dark:text-[#FAF6EE]/70 dark:hover:bg-[#722f37]/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Notice */}
        {!isSupabaseConfigured && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold">Supabase Keys Required</p>
              <p className="mt-0.5 opacity-90">
                Add <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">VITE_SUPABASE_URL</code> and <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">VITE_SUPABASE_ANON_KEY</code> to your <code className="font-mono">.env</code> file to connect your database.
              </p>
            </div>
          </div>
        )}

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* User is Logged In */}
        {user ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-[#F3EDE2] dark:bg-[#2C1D20] border border-[#B7A89A]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#722f37]/70 dark:text-[#FAF6EE]/70">Signed in as</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Cloud Synced
                </span>
              </div>
              <p className="text-sm font-semibold truncate">{user.email}</p>
              <p className="text-xs text-[#722f37]/60 dark:text-[#FAF6EE]/50">
                User ID: <span className="font-mono">{user.id.slice(0, 8)}...</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="py-3 rounded-2xl bg-[#722f37] hover:bg-[#5A232A] text-[#FAF6EE] font-bold text-xs transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Signing out...' : 'Sign Out'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="py-3 rounded-2xl bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 font-bold text-xs transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>

            {showDeleteConfirm && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 space-y-3 text-center">
                <div className="flex items-center justify-center gap-2 text-red-700 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Permanently delete cloud account?</span>
                </div>
                <p className="text-[11px] text-red-700/80">
                  This will wipe all your synced study records and profile from Supabase.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                  >
                    {loading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={loading}
                    className="flex-1 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Login / Sign Up Form */
          <form onSubmit={handleAuth} className="mt-5 space-y-3.5">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1 text-[#722f37]/80 dark:text-[#FAF6EE]/80">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#722f37]/50 dark:text-[#FAF6EE]/50" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Hunter"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F3EDE2] dark:bg-[#2C1D20] border border-[#B7A89A]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#722f37]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-[#722f37]/80 dark:text-[#FAF6EE]/80">University / College</label>
                  <div className="relative">
                    <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#722f37]/50 dark:text-[#FAF6EE]/50" />
                    <input
                      type="text"
                      placeholder="e.g. Sri Eshwar College of Engineering"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F3EDE2] dark:bg-[#2C1D20] border border-[#B7A89A]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#722f37]/50"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium mb-1 text-[#722f37]/80 dark:text-[#FAF6EE]/80">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#722f37]/50 dark:text-[#FAF6EE]/50" />
                <input
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F3EDE2] dark:bg-[#2C1D20] border border-[#B7A89A]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#722f37]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-[#722f37]/80 dark:text-[#FAF6EE]/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#722f37]/50 dark:text-[#FAF6EE]/50" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F3EDE2] dark:bg-[#2C1D20] border border-[#B7A89A]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#722f37]/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl bg-[#722f37] hover:bg-[#5A232A] text-[#FAF6EE] font-medium text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Connecting...</span>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Connect</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In & Sync Database</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-[#722f37] dark:text-[#FAF6EE]/80 hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
