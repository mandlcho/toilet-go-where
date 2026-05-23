import React, { useState } from 'react';
import {
  submitSuggestion,
  ISSUE_LABELS,
  type IssueType,
} from '../services/suggestionService';

interface EditSuggestionProps {
  placeId: string;
  placeName: string;
  userId: string | null;
}

const EditSuggestion: React.FC<EditSuggestionProps> = ({
  placeId,
  placeName,
  userId,
}) => {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>('details_incorrect');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitSuggestion(placeId, placeName, issueType, notes, userId);
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setNotes('');
        setIssueType('details_incorrect');
      }, 2000);
    } catch (err: any) {
      setError(err?.message ?? 'could not submit. try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-700"
      >
        report an issue
      </button>
    );
  }

  if (submitted) {
    return (
      <p className="text-[11px] text-green-600 font-semibold">
        thanks — we'll look into it.
      </p>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <p className="text-xs font-bold">report an issue</p>
      <select
        value={issueType}
        onChange={(e) => setIssueType(e.target.value as IssueType)}
        className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {(Object.entries(ISSUE_LABELS) as [IssueType, string][]).map(
          ([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          )
        )}
      </select>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="additional notes (optional)"
        className="w-full border border-gray-200 rounded-lg p-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={2}
      />
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-3 py-1.5 text-xs font-bold text-white bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? 'sending...' : 'submit'}
        </button>
        <button
          onClick={() => { setOpen(false); setError(null); }}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          cancel
        </button>
      </div>
    </div>
  );
};

export default EditSuggestion;
