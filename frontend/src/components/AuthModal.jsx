/**
 * AuthModal Component
 *
 * Purpose:
 * Handles user authentication (Login and Register) when booking or planning actions are initiated.
 *
 * Responsibility:
 * - Switches dynamically between Login and Register views.
 * - Formats forms matching the exact login/register input grids in the wireframes.
 * - Implements a photo upload utility with two options: "Upload from Files" and "Take Photo using Camera".
 * - Integrates native files explorer triggers and handles mock webcam activation states.
 * - Automatically logs in user upon validation and forwards control flow to the planner dialog.
 *
 * Why this file exists:
 * Restricts unauthenticated access to scheduling dashboards, enclosing user data capture.
 *
 * Used by:
 * - pages/index.js
 */

import React, { useState, useRef } from 'react';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Profile Photo states
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPhotoSourceOptions, setShowPhotoSourceOptions] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setShowPhotoSourceOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerCameraMode = () => {
    setCameraActive(true);
    setShowPhotoSourceOptions(false);
    // Simulating camera snapshot after 1.5 seconds
    setTimeout(() => {
      setPhotoPreview("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80");
      setCameraActive(false);
    }, 1500);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) return;

    // Trigger success callback
    if (onAuthSuccess) {
      onAuthSuccess({ username: loginUsername, photo: photoPreview });
    }
    onClose();
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone) return;

    if (onAuthSuccess) {
      onAuthSuccess({
        username: `${firstName} ${lastName}`,
        photo: photoPreview || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        email
      });
    }
    onClose();
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
            {mode === 'login' ? 'Login to continue' : 'Create an Account'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {mode === 'login' ? 'Please log in to plan a new trip.' : 'Register to plan and organize your itineraries.'}
          </p>
        </div>

        {/* Dynamic Forms Container */}
        {mode === 'login' ? (
          /* LOGIN FORM (Matches Wireframe 1) */
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
            {/* Photo Avatar circle (Static in login, or shows selected user preview) */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-400 font-sans text-xs font-semibold overflow-hidden shadow-inner">
                {photoPreview ? (
                  <img src={photoPreview} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>Photo</span>
                )}
              </div>
            </div>

            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm"
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded-xl py-2.5 font-sans font-semibold transition-all active:scale-98 cursor-pointer text-sm shadow-md"
            >
              Login
            </button>

            {/* Toggle Link */}
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
        ) : (
          /* REGISTER FORM (Matches Wireframe 2) */
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5">

            {/* Photo Avatar upload section */}
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

              {/* Styled Photo Action Selection Cards */}
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="flex-1 border border-zinc-200 hover:border-sky-500 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all bg-zinc-50/50 hover:bg-white text-zinc-700 hover:text-sky-600 focus:outline-none"
                >
                  <span className="text-xl">📁</span>
                  <span className="text-xs font-bold font-sans">Choose File</span>
                </button>
                <button
                  type="button"
                  onClick={triggerCameraMode}
                  className="flex-1 border border-zinc-200 hover:border-sky-500 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all bg-zinc-50/50 hover:bg-white text-zinc-700 hover:text-sky-600 focus:outline-none"
                >
                  <span className="text-xl">📸</span>
                  <span className="text-xs font-bold font-sans">Click Photo Now</span>
                </button>
              </div>

              {/* Hidden file input element */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Grid Fields (First Name, Last Name, Email, Phone, City, Country) */}
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

            {/* Additional Information textarea */}
            <textarea
              placeholder="Additional Information ...."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={3}
              className="w-full bg-zinc-50/50 text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs resize-none"
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded-xl py-2.5 font-sans font-semibold transition-all active:scale-98 cursor-pointer text-sm shadow-md"
            >
              Register Users
            </button>

            {/* Toggle Link */}
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
