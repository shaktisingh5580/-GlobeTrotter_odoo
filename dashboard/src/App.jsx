import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import Header from './components/Header';
import SearchControlBar from './components/SearchControlBar';
import NavigationTabs from './components/NavigationTabs';
import VisualAnalyticsCard from './components/VisualAnalyticsCard';
import ManageUsers from './components/ManageUsers';
import PopularCities from './components/PopularCities';
import PopularActivities from './components/PopularActivities';
import UserTrendsAnalytics from './components/UserTrendsAnalytics';
import UserTripsModal from './components/UserTripsModal';
import ChangeRoleModal from './components/ChangeRoleModal';
import AddDestinationModal from './components/AddDestinationModal';
import AddActivityModal from './components/AddActivityModal';
import AuditLogDetailModal from './components/AuditLogDetailModal';
import LoginModal from './components/LoginModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { isAuthenticated } = useAuth();

  // Active Tab state: 'trends_analytics' | 'users' | 'popular_cities' | 'popular_activities'
  const [activeTab, setActiveTab] = useState('trends_analytics');

  // Search, Filter, Sort, Group states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [selectedSort, setSelectedSort] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [popularActivities, setPopularActivities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [telemetryTrends, setTelemetryTrends] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal active states
  const [selectedUserForTrips, setSelectedUserForTrips] = useState(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [isAddDestinationOpen, setIsAddDestinationOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  // Load all dashboard metrics
  const loadDashboardData = async () => {
    if (!isAuthenticated) return;
    setIsRefreshing(true);
    try {
      const [
        statsRes,
        usersRes,
        destRes,
        popDestRes,
        popActRes,
        auditRes,
        trendsRes,
      ] = await Promise.allSettled([
        api.getStats(),
        api.getUsers({ limit: 100 }),
        api.getDestinations({ limit: 100 }),
        api.getPopularDestinations(12),
        api.getPopularActivities(12),
        api.getAuditLogs({ limit: 100 }),
        api.getAnalyticsTrends('30d'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data?.items || usersRes.value.data || []);
      if (destRes.status === 'fulfilled') setDestinations(destRes.value.data?.items || destRes.value.data || []);
      if (popDestRes.status === 'fulfilled') setPopularDestinations(popDestRes.value.data || []);
      if (popActRes.status === 'fulfilled') setPopularActivities(popActRes.value.data || []);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value.data?.items || auditRes.value.data || []);
      if (trendsRes.status === 'fulfilled') setTelemetryTrends(trendsRes.value.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  // Handlers for user actions
  const handleSaveRole = async (userId, newRole) => {
    await api.changeUserRole(userId, newRole);
    await loadDashboardData();
  };

  const handleDeleteUser = async (userId) => {
    await api.deleteUser(userId);
    await loadDashboardData();
  };

  const handleSaveDestination = async (data) => {
    await api.createDestination(data);
    await loadDashboardData();
  };

  const handleSaveActivity = async (destinationId, data) => {
    await api.createActivity(destinationId, data);
    await loadDashboardData();
  };

  // Filter options based on active tab
  const getFilterOptions = () => {
    if (activeTab === 'users') {
      return [
        { label: 'Role: USER', value: 'USER' },
        { label: 'Role: ADMIN', value: 'ADMIN' },
      ];
    }
    if (activeTab === 'popular_cities') {
      return [
        { label: 'High Popularity (Score ≥ 85)', value: 'POPULAR' },
        { label: 'Region: Europe', value: 'Europe' },
        { label: 'Region: Asia', value: 'Asia' },
        { label: 'Region: Americas', value: 'Americas' },
      ];
    }
    if (activeTab === 'popular_activities') {
      return [
        { label: 'Sightseeing', value: 'SIGHTSEEING' },
        { label: 'Food & Dining', value: 'FOOD' },
        { label: 'Adventure', value: 'ADVENTURE' },
        { label: 'Culture & History', value: 'CULTURE' },
      ];
    }
    return [
      { label: 'Action: USER_CREATED', value: 'USER_CREATED' },
      { label: 'Action: TRIP_CREATED', value: 'TRIP_CREATED' },
      { label: 'Action: EXPENSE_CREATED', value: 'EXPENSE_CREATED' },
      { label: 'Action: LOGIN_FAILED', value: 'LOGIN_FAILED' },
    ];
  };

  // Sort options based on active tab
  const getSortOptions = () => {
    if (activeTab === 'users') {
      return [
        { label: 'Name (A to Z)', value: 'name_asc' },
        { label: 'Most Trips Created', value: 'trips_desc' },
        { label: 'Recently Joined', value: 'newest' },
      ];
    }
    if (activeTab === 'popular_cities') {
      return [
        { label: 'Popularity & Visits', value: 'popularity' },
        { label: 'Name (A to Z)', value: 'name_asc' },
        { label: 'Cost (Low to High)', value: 'cost_asc' },
        { label: 'Cost (High to Low)', value: 'cost_desc' },
      ];
    }
    if (activeTab === 'popular_activities') {
      return [
        { label: 'Most Scheduled', value: 'popularity' },
        { label: 'Name (A to Z)', value: 'name_asc' },
        { label: 'Estimated Cost (Low to High)', value: 'cost_asc' },
      ];
    }
    return [
      { label: 'Newest First', value: 'newest' },
      { label: 'Oldest First', value: 'oldest' },
    ];
  };

  // Group options
  const getGroupOptions = () => {
    if (activeTab === 'users') {
      return [
        { label: 'By Role (Admin / User)', value: 'role' },
        { label: 'By Verification Status', value: 'verified' },
      ];
    }
    if (activeTab === 'popular_cities') {
      return [
        { label: 'By Country', value: 'country' },
        { label: 'By Cost Tier', value: 'cost' },
      ];
    }
    return [
      { label: 'By Category', value: 'category' },
    ];
  };

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-[#0e121a] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <Header onRefresh={loadDashboardData} isRefreshing={isRefreshing} />

      {/* Screen Title & Wireframe Indicator */}
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span className="font-handwritten text-lg text-slate-300">Admin Panel Screen / Screen 12</span>
        <span>GlobeTrotter Security & Analytics Matrix</span>
      </div>

      {/* Search & Control Bar */}
      <SearchControlBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        selectedGroup={selectedGroup}
        onGroupChange={setSelectedGroup}
        filterOptions={getFilterOptions()}
        sortOptions={getSortOptions()}
        groupOptions={getGroupOptions()}
      />

      {/* 4 Navigation Pills matching Image 1 */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
          setSelectedFilter(null);
        }}
        stats={stats}
      />

      {/* Main Content Area */}
      <main className="flex-grow pb-16">
        {/* Wireframe Canvas Visual Analytics (always available on Trends/Analytics or top overview) */}
        {activeTab === 'trends_analytics' && (
          <>
            <VisualAnalyticsCard
              stats={stats}
              popularDestinations={popularDestinations}
              popularActivities={popularActivities}
              telemetryTrends={telemetryTrends}
            />
            <UserTrendsAnalytics
              telemetryTrends={telemetryTrends}
              auditLogs={auditLogs}
              stats={stats}
              onViewAuditDetail={setSelectedAuditLog}
              searchQuery={searchQuery}
              selectedFilter={selectedFilter}
              selectedSort={selectedSort}
            />
          </>
        )}

        {/* Tab 1: Manage Users */}
        {activeTab === 'users' && (
          <ManageUsers
            users={users}
            isLoading={isLoading}
            onViewTrips={setSelectedUserForTrips}
            onChangeRole={setSelectedUserForRole}
            onDeleteUser={handleDeleteUser}
            searchQuery={searchQuery}
            selectedFilter={selectedFilter}
            selectedSort={selectedSort}
          />
        )}

        {/* Tab 2: Popular Cities */}
        {activeTab === 'popular_cities' && (
          <PopularCities
            destinations={destinations}
            popularRankings={popularDestinations}
            onAddDestination={() => setIsAddDestinationOpen(true)}
            searchQuery={searchQuery}
            selectedFilter={selectedFilter}
            selectedSort={selectedSort}
          />
        )}

        {/* Tab 3: Popular Activities */}
        {activeTab === 'popular_activities' && (
          <PopularActivities
            popularActivities={popularActivities}
            destinations={destinations}
            onAddActivity={() => setIsAddActivityOpen(true)}
            searchQuery={searchQuery}
            selectedFilter={selectedFilter}
            selectedSort={selectedSort}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      {selectedUserForTrips && (
        <UserTripsModal
          user={selectedUserForTrips}
          onClose={() => setSelectedUserForTrips(null)}
        />
      )}

      {selectedUserForRole && (
        <ChangeRoleModal
          user={selectedUserForRole}
          onClose={() => setSelectedUserForRole(null)}
          onSave={handleSaveRole}
        />
      )}

      {isAddDestinationOpen && (
        <AddDestinationModal
          onClose={() => setIsAddDestinationOpen(false)}
          onSave={handleSaveDestination}
        />
      )}

      {isAddActivityOpen && (
        <AddActivityModal
          destinations={destinations}
          onClose={() => setIsAddActivityOpen(false)}
          onSave={handleSaveActivity}
        />
      )}

      {selectedAuditLog && (
        <AuditLogDetailModal
          log={selectedAuditLog}
          onClose={() => setSelectedAuditLog(null)}
        />
      )}
    </div>
  );
}
