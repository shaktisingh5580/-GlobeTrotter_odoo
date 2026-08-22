/**
 * AuthModal Component
 *
 * Purpose:
 * Handles user authentication (Login, Register, and Forgot Password) when booking actions are initiated.
 *
 * Responsibility:
 * - Switches dynamically between Login, Register, and Forgot Password views.
 * - Formats forms matching the exact login/register input grids in the wireframes.
 * - Implements a photo upload utility with two options: "Upload from Files" and "Take Photo using Camera".
 * - Implements mock password resets and local storage updates.
 *
 * Why this file exists:
 * Restricts unauthenticated access to scheduling dashboards, enclosing user data capture.
 *
 * Used by:
 * - pages/index.js
 */

import React, { useState, useRef } from 'react';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  
  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  // Profile Photo states
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCameraMode = () => {
    setCameraActive(true);
    setTimeout(() => {
      setPhotoPreview("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80");
      setCameraActive(false);
    }, 1500);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) return;
    
    if (onAuthSuccess) {
      onAuthSuccess({ 
        username: loginUsername, 
        photo: photoPreview,
        password: loginPassword
      });
    }
    onClose();
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !regUsername || !regPassword || !email || !phone) return;

    if (onAuthSuccess) {
      onAuthSuccess({
        username: regUsername,
        password: regPassword,
        firstName,
        lastName,
        photo: photoPreview || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        email,
        phone,
        city,
        country,
        additionalInfo
      });
    }
    onClose();
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotPassword || !forgotConfirmPassword) return;
    if (forgotPassword !== forgotConfirmPassword) {
      setResetMessage("Passwords do not match.");
      return;
    }

    // Mock reset: update password in localStorage globe_user if email matches
    const storedUser = localStorage.getItem('globe_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.email === forgotEmail) {
        parsedUser.password = forgotPassword;
        localStorage.setItem('globe_user', JSON.stringify(parsedUser));
        setResetMessage("Password reset successfully. Please log in.");
        setTimeout(() => {
          setMode('login');
          setResetMessage('');
        }, 1500);
        return;
      }
    }
    setResetMessage("Password reset simulated successfully.");
    setTimeout(() => {
      setMode('login');
      setResetMessage('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-8 flex flex-col gap-6 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-none">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors text-xl font-medium cursor-pointer"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Dynamic Headers */}
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-zinc-900">
            {mode === 'login' && 'Login to continue'}
            {mode === 'register' && 'Create an Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {mode === 'login' && 'Please log in to plan a new trip.'}
            {mode === 'register' && 'Register to plan and organize your itineraries.'}
            {mode === 'forgot' && 'Provide your details to reset your password.'}
          </p>
        </div>

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="flex flex-col gap-5">
            {resetMessage && (
              <p className="text-xs text-center font-semibold text-sky-600 bg-sky-50 py-2 rounded-lg border border-sky-100 animate-in fade-in">
                {resetMessage}
              </p>
            )}
            <input
              type="email"
              required
              placeholder="Email Address"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm"
            />
            <input
              type="password"
              required
              placeholder="New Password"
              value={forgotPassword}
              onChange={(e) => setForgotPassword(e.target.value)}
              className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm"
            />
            <input
              type="password"
              required
              placeholder="Confirm New Password"
              value={forgotConfirmPassword}
              onChange={(e) => setForgotConfirmPassword(e.target.value)}
              className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm"
            />
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded-xl py-2.5 font-sans font-semibold transition-all active:scale-98 cursor-pointer text-sm shadow-md"
            >
              Reset Password
            </button>
            <p className="text-center text-xs text-zinc-500">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer underline"
              >
                Back to Login
              </button>
            </p>
          </form>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-400 font-sans text-xs font-semibold overflow-hidden shadow-inner">
                {photoPreview ? (
                  <img src={photoPreview} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>Photo</span>
                )}
              </div>
            </div>

            <input
              type="text"
              required
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm"
            />

            <div className="flex flex-col gap-2">
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm"
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold cursor-pointer underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded-xl py-2.5 font-sans font-semibold transition-all active:scale-98 cursor-pointer text-sm shadow-md"
            >
              Login
            </button>

            <p className="text-center text-xs text-zinc-500 mt-2">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer underline"
              >
                Register
              </button>
            </p>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-400 font-sans text-xs font-semibold overflow-hidden shadow-inner relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <span>Photo</span>
                )}
                {cameraActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white">
                    Taking...
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Choose File
                </button>
                <button
                  type="button"
                  onClick={triggerCameraMode}
                  className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Click Photo Now
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs sm:text-sm"
              />
              <input
                type="text"
                required
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs sm:text-sm"
              />
              <input
                type="text"
                required
                placeholder="Username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2 col-span-2 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs sm:text-sm"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2 col-span-2 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs sm:text-sm"
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2 col-span-2 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs sm:text-sm"
              />
              <input
                type="tel"
                required
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2 col-span-2 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs sm:text-sm"
              />
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs sm:text-sm"
              />
              <input
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs sm:text-sm"
              />
            </div>

            <textarea
              placeholder="Additional Information ...."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={3}
              className="w-full bg-zinc-50/50 text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs resize-none"
            />

            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded-xl py-2.5 font-sans font-semibold transition-all active:scale-98 cursor-pointer text-sm shadow-md"
            >
              Register Users
            </button>

            <p className="text-center text-xs text-zinc-500 mt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer underline"
              >
                Login
              </button>
            </p>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
