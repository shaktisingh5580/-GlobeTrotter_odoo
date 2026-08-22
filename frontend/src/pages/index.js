/**
 * Home Page Component
 *
 * Purpose:
 * Entry point for the GlobeTrotter landing route (/).
 *
 * Responsibility:
 * - Coordinates the default layout, HeroSection, SearchControlBar, AdventureGallery, and PreviousTripsSection.
 *
 * Why this file exists:
 * Root route routing file in Next.js Page Router system.
 *
 * Used by:
 * - Next.js Router
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from "./Layout/Layout";
import HeroSection from "../components/HeroSection";
import SearchControlBar from "../components/SearchControlBar";
import AdventureGallery from "../components/AdventureGallery";
import PreviousTripsSection from "../components/PreviousTripsSection";
import PlanTripModal from "../components/PlanTripModal";
import TripSectionsModal from "../components/TripSectionsModal";
import AuthModal from "../components/AuthModal";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);
  const [currentTripDetails, setCurrentTripDetails] = useState(null);

  // Check if user session exists in local storage on page load
  useEffect(() => {
    const user = localStorage.getItem('globe_user');
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleCreateTrip = (data) => {
    setCurrentTripDetails(data);
    setIsModalOpen(false);
    setIsSectionsModalOpen(true);
  };

  const handlePlanTripClick = () => {
    if (isLoggedIn) {
      setIsModalOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleAuthSuccess = (user) => {
    console.log('User logged in/registered successfully:', user);
    localStorage.setItem('globe_user', JSON.stringify(user));
    setIsLoggedIn(true);
    setIsModalOpen(true); // Continue directly to plan trip after login
  };

  const handleSaveItinerary = (fullTripData) => {
    console.log('Saving trip itinerary details:', fullTripData);
    
    // Retrieve existing trips list, append new one, and persist in local storage
    const existingTrips = JSON.parse(localStorage.getItem('globe_trips') || '[]');
    const updatedTrips = [...existingTrips, fullTripData];
    localStorage.setItem('globe_trips', JSON.stringify(updatedTrips));
    
    setIsSectionsModalOpen(false);
    
    // Redirect directly to the trips list page to view all itineraries
    router.push('/trips');
  };

  return (
    <Layout>
      <HeroSection />
      <SearchControlBar />
      <AdventureGallery />
      <PreviousTripsSection onPlanTrip={handlePlanTripClick} />
      
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <PlanTripModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreateTrip={handleCreateTrip}
      />

      <TripSectionsModal
        isOpen={isSectionsModalOpen}
        onClose={() => setIsSectionsModalOpen(false)}
        tripDetails={currentTripDetails}
        onSaveItinerary={handleSaveItinerary}
      />
    </Layout>
  );
}




