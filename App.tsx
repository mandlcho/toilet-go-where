import React, { useState, useEffect, useRef } from 'react';
import { reverseGeocode, findToilets } from './services/locationService';
import { findAtms } from './services/osmService';
import { onAuthChanged } from './services/authService';
import MapView from './components/MapView';
import BottomSheet from './components/BottomSheet';
import ToiletDetail from './components/ToiletDetail';
import Toast from './components/Toast';
import PlaceList, { LIST_PEEK_HEIGHT } from './components/PlaceList';
import type { Location, Toilet, ReviewUser } from './types';
import { haversineDistance } from './utils/distance';

const DEFAULT_CENTER: Location = { lat: 1.3521, lng: 103.8198 }; // Default to Singapore
const DEFAULT_ZOOM = 12;

type FilterState = {
  free: boolean;
  wheelchair: boolean;
  diaper: boolean;
};

const CheckmarkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5"/>
    </svg>
);

const App: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [status, setStatus] = useState<string>('checking permissions...');
  const [locationName, setLocationName] = useState<string>('awaiting permissions...');
  const [activeCategory, setActiveCategory] = useState<'toilet' | 'atm'>('toilet');
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [filteredToilets, setFilteredToilets] = useState<Toilet[]>([]);
  const [isFinding, setIsFinding] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<Location>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    free: false,
    wheelchair: false,
    diaper: false,
  });
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [currentUser, setCurrentUser] = useState<ReviewUser | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'error'|'info'|'success'} | null>(null);
  const [showSearchHere, setShowSearchHere] = useState(false);
  const [showList, setShowList] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const lastSearchCenter = useRef<Location | null>(null);
  const recenterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    const requestLocation = async () => {
      if (!navigator.geolocation || !navigator.permissions) {
        setStatus('geolocation not supported');
        setLocationName('n/a');
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

        if (permissionStatus.state === 'denied') {
          setStatus('access denied. enable in browser settings.');
          setLocationName('n/a');
          return;
        }

        setStatus('requesting location...');
        
        const geoOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        };

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            setStatus('access granted');
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setLocation(newLocation);
            setMapCenter(newLocation);
            setMapZoom(17);
            setLocationName('resolving location...');
            try {
              const name = await reverseGeocode(newLocation);
              setLocationName(name);
            } catch (error) {
              setLocationName('could not resolve location');
            }
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setStatus('access denied.');
            } else {
              setStatus(`error: ${error.message}`);
            }
            setLocationName('n/a');
          },
          geoOptions
        );
        
        permissionStatus.onchange = () => {
            if(permissionStatus.state === 'denied') {
                setStatus('access denied.');
                setLocationName('n/a');
                setLocation(null);
            }
        };

      } catch (err) {
          setStatus('could not check permissions.');
          console.error("error checking geolocation permissions:", err);
      }
    };

    requestLocation();
  }, []);

  // Check if on mobile device and show install prompt
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    console.log('[Install Prompt Debug]', {
      userAgent: navigator.userAgent,
      isMobile,
      isStandalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      navigatorStandalone: (window.navigator as any).standalone,
      willShowPrompt: isMobile && !isStandalone
    });
    
    // Only show prompt if on mobile and not already installed
    if (isMobile && !isStandalone) {
      // Show after a short delay to avoid overwhelming the user
      const timer = setTimeout(() => {
        console.log('[Install Prompt] Showing prompt now');
        setShowInstallPrompt(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthChanged((user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName || 'anonymous',
          photoURL: user.photoURL || '',
          email: user.email || '',
        });
      } else {
        setCurrentUser(null);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (activeCategory === 'atm') {
      setFilteredToilets(toilets);
      return;
    }

    let toiletsToFilter = [...toilets];
    if (filters.free) {
      // `fee` is treated as "paid" in our data model; "free" means fee === false.
      toiletsToFilter = toiletsToFilter.filter(t => t.fee === false);
    }
    if (filters.wheelchair) {
      toiletsToFilter = toiletsToFilter.filter(t => t.wheelchair === true);
    }
    if (filters.diaper) {
      toiletsToFilter = toiletsToFilter.filter(t => t.diaper === true);
    }
    // sort by distance from user (nearest first) when location is available
    if (location) {
      toiletsToFilter.sort(
        (a, b) =>
          haversineDistance(location, a.location) - haversineDistance(location, b.location)
      );
    }
    setFilteredToilets(toiletsToFilter);
  }, [toilets, filters, activeCategory, location]);

  const handleFindItsAt = async (searchLocation: Location) => {
    setIsFinding(true);
    try {
      const foundToilets = await findToilets(searchLocation);
      setToilets(foundToilets);
      setActiveCategory('toilet');
      setHasSearched(true);
      lastSearchCenter.current = searchLocation;
      setShowSearchHere(false);
      setShowList(true);
      if (foundToilets.length === 0) {
        setToast({ message: "no toilets found in this area.", type: 'info' });
      }
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "an unexpected error occurred.", type: 'error' });
    } finally {
      setIsFinding(false);
    }
  };

  const handleFindIts = async () => {
    // Allow usage even when geolocation is denied by searching around the current map center.
    const searchLocation = location ?? mapCenter;
    return handleFindItsAt(searchLocation);
  };

  const handleFindAtmsAt = async (searchLocation: Location) => {
    setIsFinding(true);
    try {
      const foundAtms = await findAtms(searchLocation);
      setActiveCategory('atm');
      setToilets(foundAtms);
      setHasSearched(true);
      lastSearchCenter.current = searchLocation;
      setShowSearchHere(false);
      if (foundAtms.length === 0) {
        setToast({ message: "no atms found in this area.", type: 'info' });
      } else {
        setShowList(true);
      }
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "an unexpected error occurred.", type: 'error' });
    } finally {
      setIsFinding(false);
    }
  };

  const handleFindAtms = async () => {
    const searchLocation = location ?? mapCenter;
    return handleFindAtmsAt(searchLocation);
  };
  
  const handleFilterChange = (filterName: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const handleViewportChanged = (center: Location, zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
    if (hasSearched && lastSearchCenter.current) {
      const dist = haversineDistance(lastSearchCenter.current, center);
      setShowSearchHere(dist > 500);
    }

    // Auto re-center after 15s of inactivity when panned away from user location
    if (recenterTimer.current) clearTimeout(recenterTimer.current);
    if (location) {
      const distFromUser = haversineDistance(location, center);
      if (distFromUser > 100) {
        recenterTimer.current = setTimeout(() => {
          setMapCenter(location);
          setMapZoom(17);
        }, 15000);
      }
    }
  };

  const filterButtonClass = "w-28 px-4 py-2 text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 shadow-sm flex items-center justify-center space-x-1.5";
  const activeFilterClass = "bg-blue-600 text-white border-blue-600";

  return (
    <div className="relative h-screen w-screen">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <MapView
        userLocation={location}
        toilets={filteredToilets}
        center={mapCenter}
        zoom={mapZoom}
        onViewportChanged={handleViewportChanged}
        onToiletSelect={setSelectedToilet}
        highlightedId={highlightedId}
      />

      {/* Re-center button */}
      {location && hasSearched && (
        <button
          onClick={() => {
            setMapCenter(location);
            setMapZoom(17);
          }}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="re-center on your location"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      )}

      {/* Floating "search this area" pill when user pans away */}
      {showSearchHere && !isFinding && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 animate-slide-down">
          <button
            onClick={() => {
              if (activeCategory === 'atm') handleFindAtmsAt(mapCenter);
              else handleFindItsAt(mapCenter);
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          >
            search this area
          </button>
        </div>
      )}

      {toilets.length > 0 && !isFinding && activeCategory === 'toilet' && (
        <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col items-center space-y-3">
            <button 
                onClick={() => handleFilterChange('free')}
                className={`${filterButtonClass} ${filters.free ? activeFilterClass : 'hover:bg-gray-100'}`}
                title="free"
            >
                {filters.free && <CheckmarkIcon />}
                <span>free</span>
            </button>
            <button 
                onClick={() => handleFilterChange('wheelchair')}
                className={`${filterButtonClass} ${filters.wheelchair ? activeFilterClass : 'hover:bg-gray-100'}`}
                title="accessible"
            >
                {filters.wheelchair && <CheckmarkIcon />}
                <span>accessible</span>
            </button>
            <button 
                onClick={() => handleFilterChange('diaper')}
                className={`${filterButtonClass} ${filters.diaper ? activeFilterClass : 'hover:bg-gray-100'}`}
                title="diaper"
            >
                {filters.diaper && <CheckmarkIcon />}
                <span>diaper</span>
            </button>
        </div>
      )}
      
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[90%] max-w-md text-center z-10"
        style={{ bottom: showList ? `${LIST_PEEK_HEIGHT + 16}px` : '16px', transition: 'bottom 0.3s ease-out' }}
      >
        {/* Category toggle */}
        <div className="flex items-center justify-center gap-1 mb-2">
          <button
            onClick={() => { setActiveCategory('toilet'); if (!hasSearched || activeCategory !== 'toilet') handleFindIts(); }}
            disabled={isFinding}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${activeCategory === 'toilet' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'} disabled:opacity-50`}
          >
            toilets
          </button>
          <button
            onClick={() => { if (activeCategory !== 'atm') { const loc = location ?? mapCenter; handleFindAtmsAt(loc); } }}
            disabled={isFinding}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${activeCategory === 'atm' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'} disabled:opacity-50`}
          >
            atms
          </button>
        </div>

        {/* Loading indicator */}
        {isFinding && (
          <div className="mb-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
              <span className="text-sm text-gray-600">searching nearby...</span>
            </div>
          </div>
        )}

        {/* Main action buttons */}
        {!isFinding && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleFindIts}
              disabled={isFinding}
              className="px-6 py-3 text-base font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
            >
              {hasSearched ? `find ${activeCategory === 'atm' ? 'atms' : 'toilets'} (${filteredToilets.length})` : `find ${activeCategory === 'atm' ? 'atms' : 'toilets'}`}
            </button>

          </div>
        )}

        {/* Onboarding hint for first-time users */}
        {!hasSearched && !isFinding && (
          <p className="mt-2 text-xs text-gray-500" style={{ textShadow: '0 0 4px white, 0 0 6px white' }}>
            tap the button to find nearby {activeCategory === 'atm' ? 'atms' : 'toilets'}
          </p>
        )}

        <div className="mt-2 text-[10px] text-black" style={{ textShadow: '0 0 4px white, 0 0 6px white' }}>
            <p><span className="font-bold">location:</span> {locationName === 'awaiting permissions...' ? status : locationName}</p>
            {!location && status.includes('denied') && <p><span className="font-bold">note:</span> searching uses the map center when location is unavailable.</p>}
        </div>
      </div>

      {showInstallPrompt && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 max-w-sm w-[90%] z-50 animate-slide-down">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">📱</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  Add FindIt to your Home Screen
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Tap <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-100 rounded text-[10px]">⬆️</span> then "Add to Home Screen"
                </p>
              </div>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {showList && (
        <PlaceList
          places={filteredToilets}
          userLocation={location}
          onSelect={setSelectedToilet}
          onClose={() => setShowList(false)}
          onHighlight={setHighlightedId}
        />
      )}

      <BottomSheet isOpen={selectedToilet !== null} onClose={() => setSelectedToilet(null)}>
        {selectedToilet && (
          <ToiletDetail
            toilet={selectedToilet}
            user={currentUser}
            onUserChange={() => {}}
            userLocation={location}
          />
        )}
      </BottomSheet>
    </div>
  );
};

export default App;
