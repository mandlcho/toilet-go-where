import React, { useEffect, useState } from 'react';
import { isFavorited, addFavorite, removeFavorite } from '../services/favoritesService';
import type { Place } from '../types';

interface FavoriteButtonProps {
  place: Place;
  userId: string | null;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ place, userId }) => {
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setFavorited(false); return; }
    isFavorited(userId, place.id).then(setFavorited);
  }, [userId, place.id]);

  const toggle = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (favorited) {
        await removeFavorite(userId, place.id);
        setFavorited(false);
      } else {
        await addFavorite(userId, place);
        setFavorited(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={!userId || loading}
      title={
        !userId
          ? 'sign in to save'
          : favorited
          ? 'remove from favorites'
          : 'add to favorites'
      }
      className="p-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-default hover:bg-gray-100 flex-shrink-0"
      aria-label={favorited ? 'unfavorite' : 'favorite'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={favorited ? '#ef4444' : 'none'}
        stroke={favorited ? '#ef4444' : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
};

export default FavoriteButton;
