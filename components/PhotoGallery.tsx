import React, { useEffect, useRef, useState } from 'react';
import { getPhotos, uploadPhoto } from '../services/photoService';
import type { Photo } from '../types';

interface PhotoGalleryProps {
  toiletId: string;
  userId: string | null;
  userName: string | null;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ toiletId, userId, userName }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const fetched = await getPhotos(toiletId);
    setPhotos(fetched);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [toiletId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !userName) return;
    setError(null);
    setUploading(true);
    try {
      const photo = await uploadPhoto(toiletId, userId, userName, file);
      setPhotos((prev) => [photo, ...prev]);
    } catch (err: any) {
      setError(err?.message ?? 'upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold">photos</p>
        {userId && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
            >
              {uploading ? 'uploading...' : '+ add photo'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500 mb-1">{error}</p>}
      {loading ? (
        <p className="text-xs text-gray-400">loading photos...</p>
      ) : photos.length === 0 ? (
        <p className="text-xs text-gray-400">
          {userId ? 'no photos yet. be the first!' : 'no photos yet.'}
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {photos.map((p) => (
            <img
              key={p.id}
              src={p.url}
              alt="toilet photo"
              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
