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

import React, { useState } from 'react';
import Layout from "./Layout/Layout";
import HeroSection from "../components/HeroSection";
import SearchControlBar from "../components/SearchControlBar";
import AdventureGallery from "../components/AdventureGallery";
import PreviousTripsSection from "../components/PreviousTripsSection";
import PlanTripModal from "../components/PlanTripModal";
import TripSectionsModal from "../components/TripSectionsModal";
import AuthModal from "../components/AuthModal";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);
  const [currentTripDetails, setCurrentTripDetails] = useState(null);

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
    setIsLoggedIn(true);
    setIsModalOpen(true); // Continue directly to plan trip after login
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
        onSaveItinerary={(data) => {
          console.log('Full trip itinerary saved successfully:', data);
          setIsSectionsModalOpen(false);
        }}
      />
    </Layout>
  );
}




