import React, { useState, useEffect } from 'react';
import { reverseGeocode, findToilets } from './services/geminiService';
import MapView from './components/MapView';
import type { Location, Toilet } from './types';

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
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [filteredToilets, setFilteredToilets] = useState<Toilet[]>([]);
  const [isFinding, setIsFinding] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<Location>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);
  const [filters, setFilters] = useState<FilterState>({
    free: false,
    wheelchair: false,
    diaper: false,
  });


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

  useEffect(() => {
    let toiletsToFilter = [...toilets];
    if (filters.free) {
      toiletsToFilter = toiletsToFilter.filter(t => t.fee === true);
    }
    if (filters.wheelchair) {
      toiletsToFilter = toiletsToFilter.filter(t => t.wheelchair === true);
    }
    if (filters.diaper) {
      toiletsToFilter = toiletsToFilter.filter(t => t.diaper === true);
    }
    setFilteredToilets(toiletsToFilter);
  }, [toilets, filters]);

  const handleFindToilets = async () => {
    if (!location) {
      alert("cannot find toilets without your location. please grant access and try again.");
      return;
    }
    setIsFinding(true);
    try {
      const foundToilets = await findToilets(location);
      setToilets(foundToilets);
      if (foundToilets.length === 0) {
        alert("no toilets found nearby.");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "an unexpected error occurred.");
    } finally {
      setIsFinding(false);
    }
  };
  
  const handleFilterChange = (filterName: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const handleViewportChanged = (center: Location, zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  const filterButtonClass = "w-28 px-4 py-2 text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 shadow-sm flex items-center justify-center space-x-1.5";
  const activeFilterClass = "bg-blue-600 text-white border-blue-600";

  return (
    <div className="relative h-screen w-screen">
      <MapView 
        userLocation={location}
        toilets={filteredToilets}
        center={mapCenter}
        zoom={mapZoom}
        onViewportChanged={handleViewportChanged}
      />

      {toilets.length > 0 && !isFinding && (
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
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md text-center">
        <button
          onClick={handleFindToilets}
          disabled={!location || isFinding}
          className="px-6 py-3 text-base font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
        >
          {isFinding ? 'finding...' : `find toilets (${filteredToilets.length})`}
        </button>

        <div className="mt-3 text-[10px] text-black" style={{ textShadow: '0 0 4px white, 0 0 6px white' }}>
            <p><span className="font-bold">location access:</span> {status}</p>
            <p><span className="font-bold">current location:</span> {locationName}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
