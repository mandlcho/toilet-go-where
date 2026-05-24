import React, { useEffect, useRef, useState } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const PEEK_HEIGHT = 320;
const SNAP_THRESHOLD = 80;

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ y: number; translate: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTranslateY(0);
      setIsFullHeight(false);
    }
  }, [isOpen]);

  const handleDragStart = (clientY: number) => {
    dragStart.current = { y: clientY, translate: translateY };
    setIsDragging(true);
  };

  const handleDragMove = (clientY: number) => {
    if (!dragStart.current) return;
    const delta = clientY - dragStart.current.y;
    const newTranslate = dragStart.current.translate + delta;
    setTranslateY(Math.max(newTranslate, -window.innerHeight * 0.4));
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
    const onMouseMove = (ev: MouseEvent) => handleDragMove(ev.clientY);
    const onMouseUp = () => {
      handleDragEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!isOpen) return null;

  const sheetHeight = isFullHeight ? '90vh' : `${PEEK_HEIGHT}px`;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl"
        style={{
          height: sheetHeight,
          transform: `translateY(${Math.max(translateY, 0)}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out, height 0.3s ease-out',
          maxHeight: '90vh',
        }}
      >
        <div
          className="flex items-center justify-between px-4 pt-3 pb-2"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="flex-1" />
          <div className="w-10 h-1 bg-gray-300 rounded-full cursor-grab active:cursor-grabbing" />
          <div className="flex-1 flex justify-end">
            <button
              onClick={onClose}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div
          className="overflow-y-auto px-5 pb-8"
          style={{ height: `calc(${sheetHeight} - 28px)` }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
