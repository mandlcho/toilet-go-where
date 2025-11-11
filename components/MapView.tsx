import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Location, Toilet } from '../types';
import { reverseGeocode } from '../services/geminiService';

const userIconSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="50" cy="50" r="45" fill="#3B82F6" stroke="#FFFFFF" stroke-width="10"/></svg>`;
const toiletIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="5" r="2" /><path d="M9 7v10H5V7z" /><line x1="12" y1="4" x2="12" y2="20" /><circle cx="17" cy="5" r="2" /><path d="M15 7l2 10 2-10z" /></svg>`;

const userIcon = new L.DivIcon({
  html: `<div class="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center border-4 border-white shadow-lg">${userIconSvg.replace('<svg', '<svg fill="white"')}</div>`,
  className: 'dummy',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

const toiletIcon = new L.DivIcon({
  html: `<div class="bg-white rounded-full p-1 w-10 h-10 flex items-center justify-center shadow-md">${toiletIconSvg}</div>`,
  className: 'dummy',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -25],
});

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    const currentZoom = map.getZoom();
    const currentCenter = map.getCenter();

    const isSameCenter = Math.abs(currentCenter.lat - center[0]) < 0.0001 &&
                         Math.abs(currentCenter.lng - center[1]) < 0.0001;

    if (currentZoom !== zoom || !isSameCenter) {
      map.setView(center, zoom);
    }
    
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [map, center, zoom]);
  
  return null;
}

function MapEventsHandler({ 
  onViewportChanged,
  onBoundsChange,
}: { 
  onViewportChanged: (center: Location, zoom: number) => void;
  onBoundsChange: (bounds: L.LatLngBounds) => void;
}) {
  const map = useMapEvents({
    load: () => {
      onBoundsChange(map.getBounds());
    },
    moveend: () => {
      onViewportChanged(map.getCenter(), map.getZoom());
      onBoundsChange(map.getBounds());
    },
  });
  return null;
}

const ToiletPopupContent: React.FC<{ toilet: Toilet }> = ({ toilet }) => {
  const [address, setAddress] = useState(toilet.address);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAddress = async () => {
      if (address === 'address not available') {
        setIsLoading(true);
        try {
          const newAddress = await reverseGeocode(toilet.location);
          setAddress(newAddress);
        } catch (error) {
          console.error("failed to reverse geocode:", error);
          setAddress('could not look up address');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAddress();
  }, [toilet, address]);
  
  const handleGoClick = () => {
    const { lat, lng } = toilet.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="text-sm w-60" style={{ minHeight: '60px' }}>
      <h3 className="font-bold text-base mb-1 break-words">{toilet.name}</h3>
      {toilet.housedIn && <p className="text-gray-600 mb-1 break-words">inside: {toilet.housedIn}</p>}
      <p className="mb-2 break-words">{isLoading ? 'looking up address...' : address}</p>
      <button 
        onClick={handleGoClick}
        className="w-full px-3 py-1 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
      >
        go
      </button>
    </div>
  );
};

interface MapViewProps {
  userLocation: Location | null;
  toilets: Toilet[];
  center: Location;
  zoom: number;
  onViewportChanged: (center: Location, zoom: number) => void;
}

const MapView: React.FC<MapViewProps> = ({ userLocation, toilets, center, zoom, onViewportChanged }) => {
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  const visibleToilets = bounds
    ? toilets.filter(toilet => bounds.contains([toilet.location.lat, toilet.location.lng]))
    : [];

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom={true} className="h-full w-full z-0">
      <ChangeView center={[center.lat, center.lng]} zoom={zoom} />
      <MapEventsHandler onViewportChanged={onViewportChanged} onBoundsChange={setBounds} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">openstreetmap</a> contributors &copy; <a href="https://carto.com/attributions">carto</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>you are here.</Popup>
        </Marker>
      )}
      {visibleToilets.map((toilet) => (
        <Marker key={toilet.id} position={[toilet.location.lat, toilet.location.lng]} icon={toiletIcon}>
          <Popup>
            <ToiletPopupContent toilet={toilet} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;