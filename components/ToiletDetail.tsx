import React, { useEffect, useState } from 'react';
import type { Toilet, Review, ReviewUser, Location } from '../types';
import { getReviews, getRating, addReview, deleteReview } from '../services/reviewService';
import { reverseGeocode } from '../services/locationService';
import { signInWithGoogle, signOut } from '../services/authService';
import { formatDistance } from '../utils/distance';
import StarRating from './StarRating';
import ConditionTags from './ConditionTags';

interface ToiletDetailProps {
  toilet: Toilet;
  user: ReviewUser | null;
  onUserChange: () => void;
  userLocation?: Location | null;
}

const ToiletDetail: React.FC<ToiletDetailProps> = ({ toilet, user, onUserChange, userLocation }) => {
  const [address, setAddress] = useState(toilet.address || '');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [fetchedReviews, ratingData] = await Promise.all([
          getReviews(toilet.id),
          getRating(toilet.id),
        ]);
        setReviews(fetchedReviews);
        setAvgRating(ratingData.average);
        setReviewCount(ratingData.count);
      } catch (err) {
        console.error('failed to load reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toilet.id]);

  useEffect(() => {
    if (!toilet.address || toilet.address === 'address not available') {
      reverseGeocode(toilet.location).then(setAddress).catch(() => setAddress('could not look up address'));
    } else {
      setAddress(toilet.address);
    }
  }, [toilet.id]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      onUserChange();
    } catch (err) {
      console.error('sign in failed:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onUserChange();
  };

  const handleSubmitReview = async () => {
    if (!user || newRating === 0) return;
    setIsSubmitting(true);
    try {
      await addReview({
        toiletId: toilet.id,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        rating: newRating,
        text: newText.trim(),
        createdAt: Date.now(),
      });
      // Refresh
      const [fetchedReviews, ratingData] = await Promise.all([
        getReviews(toilet.id),
        getRating(toilet.id),
      ]);
      setReviews(fetchedReviews);
      setAvgRating(ratingData.average);
      setReviewCount(ratingData.count);
      setNewRating(0);
      setNewText('');
      setShowForm(false);
    } catch (err) {
      console.error('failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (review: Review) => {
    if (!confirm('delete this review?')) return;
    try {
      await deleteReview(review.id, review.toiletId, review.rating);
      const [fetchedReviews, ratingData] = await Promise.all([
        getReviews(toilet.id),
        getRating(toilet.id),
      ]);
      setReviews(fetchedReviews);
      setAvgRating(ratingData.average);
      setReviewCount(ratingData.count);
    } catch (err) {
      console.error('failed to delete review:', err);
    }
  };

  const handleGoClick = () => {
    const { lat, lng } = toilet.location;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const amenities = [
    toilet.fee === false && 'free',
    toilet.wheelchair && 'wheelchair accessible',
    toilet.diaper && 'diaper changing',
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">{toilet.name}</h2>
        {toilet.housedIn && <p className="text-xs text-gray-500">inside {toilet.housedIn}</p>}
        <p className="text-xs text-gray-500 mt-1">{address || 'loading address...'}</p>
        <p className="text-xs text-gray-400 mt-1">
          {toilet.openingHours || 'hours not available'}
        </p>
        {formatDistance(userLocation ?? null, toilet.location) && (
          <p className="text-xs text-gray-400 font-mono mt-0.5">{formatDistance(userLocation ?? null, toilet.location)}</p>
        )}
      </div>

      {/* Rating summary */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold">{reviewCount > 0 ? avgRating.toFixed(1) : '—'}</span>
        <div>
          <StarRating rating={avgRating} size={18} />
          <p className="text-xs text-gray-500">{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</p>
        </div>
      </div>

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {amenities.map((a) => (
            <span key={a as string} className="px-2 py-1 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full">
              {a}
            </span>
          ))}
        </div>
      )}

      {/* Condition tags */}
      <ConditionTags toiletId={toilet.id} userId={user?.uid ?? null} />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleGoClick}
          className="flex-1 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          directions
        </button>
        <button
          onClick={() => {
            if (!user) {
              handleSignIn();
            } else {
              setShowForm(true);
            }
          }}
          className="flex-1 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
        >
          write a review
        </button>
      </div>

      {/* Auth bar */}
      {user && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
            <span>{user.displayName}</span>
          </div>
          <button onClick={handleSignOut} className="underline hover:text-gray-700">sign out</button>
        </div>
      )}

      {/* Review form */}
      {showForm && user && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold mb-1">your rating</p>
            <StarRating rating={newRating} size={28} interactive onChange={setNewRating} />
          </div>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="share your experience (optional)"
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmitReview}
              disabled={newRating === 0 || isSubmitting}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'posting...' : 'post'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewRating(0); setNewText(''); }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              cancel
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div>
        <h3 className="text-sm font-bold mb-3">reviews</h3>
        {isLoading ? (
          <p className="text-xs text-gray-400">loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-xs text-gray-400">no reviews yet. be the first!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <img src={review.userPhoto} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                  <span className="text-xs font-semibold">{review.userName}</span>
                  <span className="text-[10px] text-gray-400">{formatDate(review.createdAt)}</span>
                </div>
                <StarRating rating={review.rating} size={14} />
                {review.text && <p className="text-xs text-gray-700 mt-1">{review.text}</p>}
                {user && user.uid === review.userId && (
                  <button
                    onClick={() => handleDeleteReview(review)}
                    className="text-[10px] text-red-400 hover:text-red-600 mt-1"
                  >
                    delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToiletDetail;
