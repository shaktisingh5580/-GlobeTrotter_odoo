/**
 * User Profile Page Component
 *
 * Purpose:
 * Renders the authenticated user's profile dashboard route (/profile) with in-place editing and Change Password features integrated with NestJS.
 *
 * Responsibility:
 * - Fetches user attributes from /users/me.
 * - Submits profile updates to PATCH /users/me.
 * - Submits password updates to PATCH /users/me/password.
 * - Restricts access to guest users by redirecting unauthenticated viewports back to home.
 * - Integrates navigation links back to the /trips overview directory.
 *
 * Used by:
 * - Next.js Router (/profile)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../pages/Layout/Layout';
import api from '../services/api';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tripsCount, setTripsCount] = useState(0);
  
  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState(''); // email local display
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  // Password Update States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('globe_access_token') : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('globe_user') : null;

    if (!token && !storedUser) {
      router.push('/');
      return;
    }

    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        setFirstName(u.first_name || u.firstName || '');
        setLastName(u.last_name || u.lastName || '');
        setEmail(u.email || '');
        setCity(u.city || '');
        setCountry(u.country || '');
      } catch {}
    }

    if (token) {
      // Fetch profile details from database
      api.get('/users/me')
        .then(res => {
          const profile = res?.data || res;
          if (!profile) return;
          setUser(profile);
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
          setUsername(profile.first_name ? `${profile.first_name} ${profile.last_name}` : (profile.email ? profile.email.split('@')[0] : 'User'));
          setEmail(profile.email || '');
          setPhone(profile.phone || '');
          setCity(profile.city || '');
          setCountry(profile.country || '');
          setAdditionalInfo(profile.bio || '');
          setPhotoPreview(profile.avatar_url || '');
        })
        .catch(err => {
          console.warn('Backend user profile fetch notice:', err.message);
        });

      // Fetch user trip stats count
      api.get('/users/me/stats')
        .then(res => {
          const stats = res?.data || res;
          if (stats) setTripsCount(stats.total_trips || 0);
        })
        .catch(err => {
          console.warn('Backend stats fetch notice:', err.message);
        });
    }
  }, []);

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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setPasswordMessage('');

      // 1. Submit Profile fields updates
      const updatedProfile = await api.patch('/users/me', {
        first_name: firstName,
        last_name: lastName,
        bio: additionalInfo,
        phone: phone,
        city: city,
        country: country
      });

      // 2. Handle Password change if requested
      if (newPassword) {
        if (!currentPassword) {
          setPasswordMessage("Current password is required to change password.");
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setPasswordMessage("New passwords do not match.");
          return;
        }
        await api.patch('/users/me/password', {
          current_password: currentPassword,
          new_password: newPassword
        });
      }

      // Sync local profile updates
      setUser(updatedProfile);
      localStorage.setItem('globe_user', JSON.stringify(updatedProfile));
      setIsEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordMessage('');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setPasswordMessage(err.message || 'Failed to save changes.');
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="w-full min-h-screen bg-white flex items-center justify-center">
          <p className="text-zinc-500 font-sans text-sm">Loading profile details...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full bg-[#FCF8F2]/30 min-h-screen pt-24 pb-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Back Nav Link */}
          <div className="flex items-center justify-between pb-2">
            <button
              onClick={() => router.push('/trips')}
              className="text-xs sm:text-sm font-semibold text-zinc-500 hover:text-zinc-950 flex items-center gap-2 cursor-pointer transition-colors"
            >
              &larr; Back to Trips
            </button>
            <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold tracking-wider uppercase font-sans">
              User Profile Profile
            </span>
          </div>

          {/* Profile Card Form */}
          <form onSubmit={handleSaveProfile} className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.03)] flex flex-col gap-8">
            
            {/* Top row: Avatar upload controls & Name labels */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left border-b border-zinc-100 pb-6 relative">
              
              {/* Avatar upload wrapper */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-24 h-24 rounded-full border-2 border-sky-500/20 overflow-hidden relative shadow-md bg-zinc-50 flex items-center justify-center text-zinc-400 font-bold text-xs">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt={username}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <span>Photo</span>
                  )}
                  {cameraActive && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white">
                      Taking...
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2 py-1 rounded font-bold cursor-pointer transition-colors"
                    >
                      Files
                    </button>
                    <button
                      type="button"
                      onClick={triggerCameraMode}
                      className="text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2 py-1 rounded font-bold cursor-pointer transition-colors"
                    >
                      Camera
                    </button>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              <div className="flex-grow flex flex-col gap-1.5 justify-center">
                <h1 className="text-xl sm:text-2xl font-serif font-normal text-zinc-950">
                  {firstName && lastName ? `${firstName} ${lastName}` : username}
                </h1>
                <p className="text-zinc-400 text-xs sm:text-sm font-medium">
                  {email}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1">
                  <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    Traveler
                  </span>
                  <span className="bg-zinc-100 text-zinc-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {tripsCount} Saved Trips
                  </span>
                </div>
              </div>

              {/* Edit Toggle buttons */}
              <div className="sm:absolute sm:top-0 sm:right-0 mt-3 sm:mt-0">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="bg-sky-600 hover:bg-sky-500 text-white border border-transparent rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setPasswordMessage('');
                      }}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Fields Details Grid (Switches to Inputs when isEditing is true) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                  First Name
                </span>
                {isEditing ? (
                  <input 
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-transparent text-zinc-800 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm mt-1"
                  />
                ) : (
                  <span className="text-sm font-semibold text-zinc-800 font-sans">
                    {user.first_name || 'Not specified'}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                  Last Name
                </span>
                {isEditing ? (
                  <input 
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-transparent text-zinc-800 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm mt-1"
                  />
                ) : (
                  <span className="text-sm font-semibold text-zinc-800 font-sans">
                    {user.last_name || 'Not specified'}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                  Email Address
                </span>
                <span className="text-sm font-semibold text-zinc-600 font-sans mt-2">
                  {user.email}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                  Phone Number
                </span>
                {isEditing ? (
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent text-zinc-800 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm mt-1"
                  />
                ) : (
                  <span className="text-sm font-semibold text-zinc-800 font-sans">
                    {user.phone || 'Not specified'}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                  City
                </span>
                {isEditing ? (
                  <input 
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent text-zinc-800 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm mt-1"
                  />
                ) : (
                  <span className="text-sm font-semibold text-zinc-800 font-sans">
                    {user.city || 'Not specified'}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                  Country
                </span>
                {isEditing ? (
                  <input 
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-transparent text-zinc-800 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm mt-1"
                  />
                ) : (
                  <span className="text-sm font-semibold text-zinc-800 font-sans">
                    {user.country || 'Not specified'}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2 border-t border-zinc-100 pt-4">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                  Additional Information / Bio
                </span>
                {isEditing ? (
                  <textarea 
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-50/50 text-zinc-800 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm mt-1 resize-none"
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-sans whitespace-pre-line mt-1">
                    {user.bio || 'No bio or additional details provided.'}
                  </p>
                )}
              </div>

              {/* SECURITY & CHANGE PASSWORD SECTION (Visible only in edit mode) */}
              {isEditing && (
                <div className="flex flex-col gap-4 sm:col-span-2 border-t border-zinc-100 pt-4 mt-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Security / Change Password
                  </h3>
                  
                  {passwordMessage && (
                    <p className="text-xs font-semibold text-sky-700 bg-sky-50 py-2 px-3 rounded-lg border border-sky-100">
                      {passwordMessage}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                        Current Password
                      </span>
                      <input 
                        type="password"
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-transparent text-zinc-800 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm mt-1"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                        New Password
                      </span>
                      <input 
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-transparent text-zinc-800 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm mt-1"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                        Confirm New Password
                      </span>
                      <input 
                        type="password"
                        placeholder="Confirm password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full bg-transparent text-zinc-800 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

          </form>

        </div>
      </div>
    </Layout>
  );
}
