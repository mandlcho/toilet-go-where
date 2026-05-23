import React from 'react';
import type { Toilet, Location } from '../types';
import { formatDistance } from '../utils/distance';

interface PlaceListProps {
  places: Toilet[];
  userLocation: Location | null;
  onSelect: (place: Toilet) => void;
  onClose: () => void;
}

const PlaceList: React.FC<PlaceListProps> = ({ places, userLocation, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold">
          {places.length} result{places.length !== 1 ? 's' : ''}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          aria-label="close list"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {places.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-12">
            no results. search an area first.
          </p>
        ) : (
          places.map((place) => {
            const dist = formatDistance(userLocation, place.location);
            const amenities = [
              place.fee === false && 'free',
              place.wheelchair && 'accessible',
              place.diaper && 'diaper',
            ].filter(Boolean) as string[];

            return (
              <button
                key={place.id}
                onClick={() => { onSelect(place); onClose(); }}
                className="w-full text-left px-5 py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <p className="text-sm font-semibold truncate">{place.name}</p>
                {place.address && place.address !== 'address not available' && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{place.address}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {dist && (
                    <span className="text-[10px] text-gray-400 font-mono">{dist}</span>
                  )}
                  {amenities.map((a) => (
                    <span
                      key={a}
                      className="px-1.5 py-0.5 text-[9px] font-semibold bg-gray-100 text-gray-600 rounded-full"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlaceList;
