import React, { useEffect, useState } from 'react';
import { getTags, toggleTag, TAG_LABELS, TAG_KEYS } from '../services/tagService';

interface ConditionTagsProps {
  toiletId: string;
  userId: string | null;
}

const ConditionTags: React.FC<ConditionTagsProps> = ({ toiletId, userId }) => {
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const fetched = await getTags(toiletId);
    const map: Record<string, string[]> = {};
    for (const t of fetched) map[t.tagKey] = t.votes;
    setTags(map);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [toiletId]);

  const handleToggle = async (tagKey: string) => {
    if (!userId) return;
    const currentVotes = tags[tagKey] ?? [];
    const voted = currentVotes.includes(userId);
    setTags((prev) => ({
      ...prev,
      [tagKey]: voted
        ? currentVotes.filter((id) => id !== userId)
        : [...currentVotes, userId],
    }));
    await toggleTag(toiletId, tagKey, userId, voted);
  };

  if (loading) {
    return <p className="text-xs text-gray-400">loading tags...</p>;
  }

  return (
    <div>
      <p className="text-xs font-bold mb-2">condition</p>
      <div className="flex flex-wrap gap-2">
        {TAG_KEYS.map((key) => {
          const votes = tags[key] ?? [];
          const voted = userId ? votes.includes(userId) : false;
          return (
            <button
              key={key}
              onClick={() => handleToggle(key)}
              disabled={!userId}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-colors ${
                voted
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              } disabled:cursor-default`}
            >
              {TAG_LABELS[key]}
              {votes.length > 0 ? ` (${votes.length})` : ''}
            </button>
          );
        })}
      </div>
      {!userId && (
        <p className="text-[10px] text-gray-400 mt-1">sign in to vote</p>
      )}
    </div>
  );
};

export default ConditionTags;
