import React, { useRef, useState } from 'react';
import type { Toilet, Location } from '../types';
import { formatDistance } from '../utils/distance';

export const LIST_PEEK_HEIGHT = 260;
const SNAP_THRESHOLD = 60;

interface PlaceListProps {
  places: Toilet[];
  userLocation: Location | null;
  onSelect: (place: Toilet) => void;
  onClose: () => void;
  onHighlight?: (id: string | null) => void;
  onFocus?: (place: Toilet) => void;
}

const PlaceList: React.FC<PlaceListProps> = ({ places, userLocation, onSelect, onClose, onHighlight, onFocus }) => {
  const [translateY, setTranslateY] = useState(0);
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tappedId, setTappedId] = useState<string | null>(null);
  const dragStart = useRef<{ y: number; translate: number } | null>(null);

  const handleDragStart = (clientY: number) => {
    dragStart.current = { y: clientY, translate: translateY };
    setIsDragging(true);
  };

  const handleDragMove = (clientY: number) => {
    if (!dragStart.current) return;
    const delta = clientY - dragStart.current.y;
    const next = dragStart.current.translate + delta;
    setTranslateY(Math.max(next, -window.innerHeight * 0.6));
  };

  const handleDragEnd = () => {
    if (!dragStart.current) return;
    setIsDragging(false);
    if (translateY > SNAP_THRESHOLD) {
      onClose();
    } else if (translateY < -SNAP_THRESHOLD) {
      setIsFullHeight(true);
      setTranslateY(0);
    } else {
      setIsFullHeight(false);
      setTranslateY(0);
    }
    dragStart.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY);
  const handleTouchEnd = () => handleDragEnd();

  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY);
    const onMove = (ev: MouseEvent) => handleDragMove(ev.clientY);
    const onUp = () => {
      handleDragEnd();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const sheetHeight = isFullHeight ? '82vh' : `${LIST_PEEK_HEIGHT}px`;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 bg-white rounded-t-2xl"
      style={{
        height: sheetHeight,
        maxHeight: '82vh',
        transform: `translateY(${Math.max(translateY, 0)}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out, height 0.3s ease-out',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
      }}
    >
      {/* Drag handle */}
      <div
        className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {places.length} result{places.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="close list"
        >
          ✕
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto border-t border-gray-100" style={{ height: `calc(${sheetHeight} - 72px)` }}>
        {places.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-8">no results.</p>
        ) : (
          places.map((place) => {
            const dist = formatDistance(userLocation, place.location);
            const amenities = [
              place.fee === false && 'free',
              place.wheelchair && 'accessible',
              place.diaper && 'diaper',
            ].filter(Boolean) as string[];

            const isActive = tappedId === place.id;

            return (
              <button
                key={place.id}
                onMouseEnter={() => { setTappedId(place.id); onHighlight?.(place.id); onFocus?.(place); }}
                onMouseLeave={() => { setTappedId(null); onHighlight?.(null); }}
                onClick={() => {
                  if (isActive) {
                    onSelect(place);
                    setTappedId(null);
                    onHighlight?.(null);
                  } else {
                    setTappedId(place.id);
                    onHighlight?.(place.id);
                    onFocus?.(place);
                  }
                }}
                className={`w-full text-left px-5 py-3 border-b border-gray-50 transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50 active:bg-gray-100'}`}
              >
                <p className="text-sm font-semibold truncate">{place.name}</p>
                {place.address && place.address !== 'address not available' && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{place.address}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {dist && <span className="text-[10px] text-gray-400 font-mono">{dist}</span>}
                  {amenities.map((a) => (
                    <span key={a} className="px-1.5 py-0.5 text-[9px] font-semibold bg-gray-100 text-gray-600 rounded-full">
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
