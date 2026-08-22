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
import api from "../services/api";

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

  // Open auth modal automatically when ?login=1 is in the URL (from header Log In pill)
  useEffect(() => {
    if (router.query.login === '1' && !isLoggedIn) {
      setIsAuthOpen(true);
    }
  }, [router.query.login, isLoggedIn]);

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
    console.log('User logged in successfully:', user);
    setIsLoggedIn(true);
    setIsModalOpen(true);
  };

  const handleSaveItinerary = async (fullTripData) => {
    console.log('Saving trip itinerary details to backend:', fullTripData);
    
    try {
      // 1. Create the parent trip in NestJS backend
      const tripPayload = {
        title: fullTripData.tripName,
        description: fullTripData.place,
        start_date: fullTripData.startDate, 
        end_date: fullTripData.endDate, 
        budget_limit: parseFloat(fullTripData.budget.replace(/[^0-9.]/g, '')) || 0,
        currency: 'INR',
        status: 'PLANNED'
      };

      const trip = await api.post('/trips', tripPayload);

      // 2. Create each itinerary section sequentially
      if (fullTripData.sections && fullTripData.sections.length > 0) {
        for (let i = 0; i < fullTripData.sections.length; i++) {
          const sec = fullTripData.sections[i];
          const sectionPayload = {
            title: sec.title,
            description: sec.description || '',
            section_type: 'CUSTOM',
            start_date: sec.startDate || fullTripData.startDate,
            end_date: sec.endDate || fullTripData.endDate,
            planned_budget: parseFloat(sec.budget.replace(/[^0-9.]/g, '')) || 0,
            section_order: i + 1
          };
          await api.post(`/trips/${trip.id}/sections`, sectionPayload);
        }
      }

      setIsSectionsModalOpen(false);

      // Get user id to dynamic redirect to specific trip page
      const userStr = localStorage.getItem('globe_user');
      const user = JSON.parse(userStr || '{}');
      const userId = user.id || 'me';
      router.push(`/${userId}/trip/${trip.id}`);
    } catch (err) {
      console.error('Failed to save itinerary to backend:', err);
      alert(err.message || 'Failed to save itinerary.');
    }
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




