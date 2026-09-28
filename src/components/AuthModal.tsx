import { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Mode = 'signin' | 'signup' | 'forgot-email' | 'forgot-reset';

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp, sendResetCode, verifyCodeAndReset } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const isForgot = mode.startsWith('forgot');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    if (mode === 'forgot-email') {
      const { error: err, code: genCode } = await sendResetCode(email.trim());
      setSubmitting(false);
      if (err) {
        setError(err);
        return;
      }
      if (genCode && genCode !== '------') {
        setGeneratedCode(genCode);
        setInfo(`Your 6-digit code is: ${genCode}`);
        setMode('forgot-reset');
      } else {
        setError('No account found with that email address.');
      }
      return;
    }

    if (mode === 'forgot-reset') {
      if (code.trim().length !== 6) {
        setError('Please enter the 6-digit code.');
        setSubmitting(false);
        return;
      }
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters.');
        setSubmitting(false);
        return;
      }
      const { error: err } = await verifyCodeAndReset(email.trim(), code.trim(), newPassword);
      setSubmitting(false);
      if (err) {
        setError(err);
        return;
      }
      setInfo('Password updated successfully! You can now log in with your new password.');
      setGeneratedCode(null);
      setCode('');
      setNewPassword('');
      return;
    }

    const fn = mode === 'signin' ? signIn : signUp;
    const { error: err } = await fn(email.trim(), password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    resetAll();
    onClose();
  };

  const resetAll = () => {
    setEmail('');
    setPassword('');
    setNewPassword('');
    setCode('');
    setGeneratedCode(null);
    setError(null);
    setInfo(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
    setGeneratedCode(null);
  };

  const closeAndReset = () => {
    resetAll();
    setMode('signin');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAndReset} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl p-8 animate-in">
        <button
          onClick={closeAndReset}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-slate-500" strokeWidth={1.5} />
        </button>

        {isForgot && (
          <button
            onClick={() => {
              if (mode === 'forgot-email') {
                switchMode('signin');
              } else {
                switchMode('forgot-email');
              }
            }}
            className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs text-slate-500"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back
          </button>
        )}

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1168b0] text-white mb-3">
            {isForgot ? (
              <KeyRound className="w-6 h-6" strokeWidth={1.5} />
            ) : (
              <UserIcon className="w-6 h-6" strokeWidth={1.5} />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {mode === 'signin' && 'Login to ShopWave'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot-email' && 'Reset Password'}
            {mode === 'forgot-reset' && 'Verify & Reset'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'signin' && 'Sign in to check out and track your orders.'}
            {mode === 'signup' && 'Join ShopWave to shop, save, and track orders.'}
            {mode === 'forgot-email' && 'Enter your email and we’ll generate a 6-digit code to reset your password.'}
            {mode === 'forgot-reset' && 'Enter the code and your new password to finish resetting.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email — shown on signin, signup, forgot-email */}
          {(mode === 'signin' || mode === 'signup' || mode === 'forgot-email') && (
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
              />
            </div>
          )}

          {/* Password — shown on signin and signup */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                className="w-full pl-10 pr-11 py-3 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </div>
          )}

          {/* Code + new password — shown on forgot-reset */}
          {mode === 'forgot-reset' && (
            <>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors tracking-[0.5em] font-semibold"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="w-full pl-10 pr-11 py-3 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                </button>
              </div>
            </>
          )}

          {mode === 'signin' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => switchMode('forgot-email')}
                className="text-xs text-[#1168b0] font-medium hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-4 py-2">{error}</p>}

          {info && (
            <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-md px-4 py-2.5 border border-emerald-200">
              {mode === 'forgot-reset' || info.includes('updated') ? (
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
              ) : (
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
              )}
              <span>{info}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1168b0] text-white py-3.5 rounded-md text-sm font-bold uppercase tracking-wide hover:bg-[#0d5a9c] transition-colors disabled:opacity-50"
          >
            {submitting
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Login'
                : mode === 'signup'
                  ? 'Sign Up'
                  : mode === 'forgot-email'
                    ? 'Send Code'
                    : 'Reset Password'}
          </button>
        </form>

        {/* Resend code link while on reset step */}
        {mode === 'forgot-reset' && (
          <p className="text-center text-xs text-slate-400 mt-4">
            Didn’t get the code?{' '}
            <button
              type="button"
              onClick={async () => {
                setError(null);
                setInfo(null);
                setSubmitting(true);
                const { error: err, code: genCode } = await sendResetCode(email.trim());
                setSubmitting(false);
                if (err) {
                  setError(err);
                } else if (genCode && genCode !== '------') {
                  setGeneratedCode(genCode);
                  setInfo(`Your 6-digit code is: ${genCode}`);
                } else {
                  setError('No account found with that email address.');
                }
              }}
              className="text-[#1168b0] font-medium hover:underline transition-colors"
            >
              Resend code
            </button>
          </p>
        )}

        {!isForgot && (
          <p className="text-center text-sm text-slate-400 mt-5">
            {mode === 'signin' ? 'New to ShopWave? ' : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-[#1168b0] font-medium hover:underline transition-colors"
            >
              {mode === 'signin' ? 'Create an account' : 'Login'}
            </button>
          </p>
        )}

        {mode === 'forgot-reset' && info && info.includes('updated') && (
          <p className="text-center text-sm text-slate-400 mt-5">
            <button
              onClick={() => {
                resetAll();
                setMode('signin');
              }}
              className="text-[#1168b0] font-medium hover:underline transition-colors"
            >
              Back to login
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
