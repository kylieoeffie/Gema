import React, { useState } from 'react';
import { authAPI } from '../lib/api';

interface AuthProps {
  onLogin: (user: any) => void;
}

export function AuthPage({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const result = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
        onLogin(result.user);
      } else {
        // Sign up
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const result = await authAPI.signup({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        onLogin(result.user);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Simple, clear error message
      setError('Backend server is not running. Please use Demo Mode below.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <span className="text-lg font-black">SW</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">SameWave</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Discover music through community threads
          </p>
        </div>

        {/* Auth Form */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6">
            <h1 className="text-xl font-semibold mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isLogin ? 'Sign in to your account' : 'Join the music discovery community'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="Choose a username"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-900 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ username: '', email: '', password: '', confirmPassword: '' });
              }}
              className="block w-full text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>

            <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 mb-2">Backend not running? No problem!</p>
              <button
                onClick={() => {
                  // Clear any existing errors first
                  setError('');
                  setLoading(false);
                  
                  // Create demo user and login immediately
                  const demoUser = {
                    id: 'demo_user',
                    username: 'demo',
                    email: 'demo@local',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
                  };
                  
                  // Login with demo user
                  onLogin(demoUser);
                }}
                className="w-full rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-800"
              >
                🚀 Try Demo Mode
              </button>
            </div>
          </div>

          {/* Demo accounts */}
          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Demo Accounts</h3>
            <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div>Email: demo@samewave.com | Password: demo123</div>
              <div>Email: test@samewave.com | Password: test123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}