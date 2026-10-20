import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, X } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { user, profile, error, signIn, signUp, signOut, clearError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setSubmitted(false);
    const ok = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, fullName);
    setBusy(false);
    if (ok) {
      setSubmitted(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-primary-950/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-sm bg-warmwhite p-6 shadow-2xl sm:p-8">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-primary-500 hover:bg-primary-50" aria-label="Close account dialog">
          <X className="h-5 w-5" />
        </button>
        {user ? (
          <div className="pt-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100"><UserRound className="h-7 w-7 text-primary-700" /></div>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-primary-900">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}</h2>
            <p className="mt-2 text-sm text-primary-500">{user.email}</p>
            <button onClick={async () => { await signOut(); onClose(); }} className="mt-6 w-full rounded-sm border border-primary-300 px-5 py-3 text-sm font-medium text-primary-800 hover:bg-primary-50">Sign out</button>
          </div>
        ) : (
          <>
            <div className="mb-6 pt-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-500">Sattva Life account</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-primary-900">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
              <p className="mt-2 text-sm leading-relaxed text-primary-500">Save orders, track deliveries, and keep your everyday essentials close.</p>
            </div>
            <div className="mb-5 grid grid-cols-2 rounded-sm bg-primary-50 p-1">
              <button onClick={() => { setMode('signin'); clearError(); setSubmitted(false); }} className={`rounded-sm py-2 text-sm font-medium ${mode === 'signin' ? 'bg-white text-primary-900 shadow-sm' : 'text-primary-500'}`}>Sign in</button>
              <button onClick={() => { setMode('signup'); clearError(); setSubmitted(false); }} className={`rounded-sm py-2 text-sm font-medium ${mode === 'signup' ? 'bg-white text-primary-900 shadow-sm' : 'text-primary-500'}`}>Sign up</button>
            </div>
            {submitted && <div className="mb-4 rounded-sm bg-sage-50 p-3 text-sm text-sage-800">Your account is ready. You can continue shopping.</div>}
            {error && <div className="mb-4 rounded-sm bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && <label className="block text-sm text-primary-700"><span className="mb-1.5 block font-medium">Full name</span><span className="relative block"><UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" /><input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-sm border border-primary-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-primary-500" placeholder="Your name" /></span></label>}
              <label className="block text-sm text-primary-700"><span className="mb-1.5 block font-medium">Email address</span><span className="relative block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-sm border border-primary-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-primary-500" placeholder="you@example.com" /></span></label>
              <label className="block text-sm text-primary-700">
                <span className="mb-1.5 block font-medium">Password</span>
                <span className="relative block">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
                  <input
                    required
                    minLength={6}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-sm border border-primary-200 bg-white py-3 pl-10 pr-10 text-sm outline-none focus:border-primary-500"
                    placeholder={mode === 'signup' ? 'Choose a strong password (min 6 chars)' : 'Enter your password'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400" aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
                {mode === 'signup' && (
                  <span className="mt-1 block text-[11px] text-primary-400">
                    Use at least 6 characters (avoid common sequences like 123456).
                  </span>
                )}
              </label>
              <button disabled={busy} className="w-full rounded-sm bg-primary-700 px-5 py-3.5 text-sm font-medium tracking-wide text-white hover:bg-primary-800 disabled:cursor-wait disabled:bg-primary-300">{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
