import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { SparklesIcon, XIcon, CheckIcon } from './constants';
import LoadingSpinner from './LoadingSpinner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView: 'login' | 'signup';
  initialError?: string | null;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView, initialError }) => {
  const [view, setView] = useState(initialView);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) {
        setError("Could not start Google Sign-In. " + error.message);
        setIsLoading(false);
    }
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (view === 'signup') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          throw new Error("All fields are required.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: { name: name.trim() }
          }
        });
        if (error) throw error;
        
        setSuccessMessage("Success! Please check your email for a confirmation link to complete your registration.");

      } else { // Login
        if (!email.trim() || !password.trim()) {
          throw new Error("Email and password are required.");
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        onClose(); // Close modal, onAuthStateChange listener will do the rest.
      }
    } catch (e: any) {
        console.error("Supabase Auth Error:", e);
        if (e.message && e.message.toLowerCase().includes('email not confirmed')) {
            setError("Your email is not confirmed. Please check your inbox for the confirmation link.");
        } else {
            setError(e.message || 'An authentication error occurred. Please try again.');
        }
    } finally {
        setIsLoading(false);
    }
  };
    
  if (!isOpen) return null;

  const inputClasses = "w-full p-3 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] border border-slate-300 bg-slate-50";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl text-slate-900 overflow-hidden auth-modal" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-800 transition-colors z-20">
          <XIcon className="w-6 h-6" />
        </button>
        
        <div className="p-8">
          {isLoading ? <LoadingSpinner text={view === 'login' ? 'Logging in...' : 'Creating profile...'} /> : successMessage ? (
             <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Check Your Email</h3>
                <p className="text-slate-600 mt-2">{successMessage}</p>
                 <button onClick={onClose} className="w-full mt-6 py-3 font-semibold rounded-lg blueprint-button">
                    Close
                </button>
            </div>
          ) : (
            <>
                <div className="text-center mb-6">
                    <SparklesIcon className="w-10 h-10 mx-auto" style={{ color: 'var(--color-accent)' }} />
                    <h2 className="text-2xl font-bold mt-2">
                        {view === 'login' ? 'Welcome Back' : 'Create Your Profile'}
                    </h2>
                </div>
                <div className="flex flex-col items-center space-y-4">
                    <button onClick={handleGoogleSignIn} className="flex items-center justify-center w-full max-w-sm p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h12.8c-.57 2.91-2.29 5.37-4.88 7.02l7.45 5.73c4.4-4.04 6.95-10.02 6.95-16.71z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.45-5.73c-2.15 1.45-4.92 2.3-8.44 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                        Sign {view === 'login' ? 'in' : 'up'} with Google
                    </button>
                    <div className="flex items-center w-full">
                        <hr className="w-full border-t border-slate-200" />
                        <span className="px-2 text-xs text-slate-400">OR</span>
                        <hr className="w-full border-t border-slate-200" />
                    </div>
                    <form onSubmit={handleEmailPasswordSubmit} className="w-full max-w-sm mx-auto">
                        <div className="space-y-4">
                            {view === 'signup' && (
                                <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                            )}
                            <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} required />
                            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} required />
                            {view === 'signup' && (
                                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClasses} required />
                            )}
                        </div>
                        {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
                        <button type="submit" className="w-full mt-6 py-3 font-semibold rounded-lg blueprint-button">
                            {view === 'login' ? 'Log In' : 'Sign Up'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-slate-500 mt-6">
                        {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(null); setSuccessMessage(null); }} className="font-medium text-[var(--color-accent)] hover:underline">
                            {view === 'login' ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
