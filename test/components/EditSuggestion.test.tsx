import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditSuggestion from '../../components/EditSuggestion';
import * as suggestionService from '../../services/suggestionService';

vi.mock('../../services/suggestionService', () => ({
  submitSuggestion: vi.fn(),
  ISSUE_LABELS: {
    wrong_location: 'wrong location',
    no_longer_exists: 'no longer exists',
    details_incorrect: 'details are incorrect',
    other: 'other',
  },
}));

describe('EditSuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(suggestionService.submitSuggestion).mockResolvedValue(undefined);
  });

  it('renders as a "report an issue" link initially', () => {
    render(<EditSuggestion placeId="p1" placeName="test toilet" userId={null} />);
    expect(screen.getByText('report an issue')).toBeInTheDocument();
    expect(screen.queryByText('submit')).not.toBeInTheDocument();
  });

  it('opens the form when the link is clicked', async () => {
    render(<EditSuggestion placeId="p1" placeName="test toilet" userId={null} />);
    await userEvent.click(screen.getByText('report an issue'));
    expect(screen.getByText('submit')).toBeInTheDocument();
    expect(screen.getByText('cancel')).toBeInTheDocument();
    expect(screen.getByText('report an issue')).toBeInTheDocument();
  });

  it('collapses back to the link on cancel', async () => {
    render(<EditSuggestion placeId="p1" placeName="test toilet" userId={null} />);
    await userEvent.click(screen.getByText('report an issue'));
    await userEvent.click(screen.getByText('cancel'));
    expect(screen.queryByText('submit')).not.toBeInTheDocument();
  });

  it('calls submitSuggestion with correct args', async () => {
    render(<EditSuggestion placeId="p1" placeName="test toilet" userId="user1" />);
    await userEvent.click(screen.getByText('report an issue'));
    await userEvent.type(screen.getByPlaceholderText(/additional notes/), 'locked door');
    await userEvent.click(screen.getByText('submit'));
    expect(suggestionService.submitSuggestion).toHaveBeenCalledWith(
      'p1',
      'test toilet',
      'details_incorrect',
      'locked door',
      'user1'
    );
  });

  it('shows success message after successful submit', async () => {
    render(<EditSuggestion placeId="p1" placeName="test toilet" userId="user1" />);
    await userEvent.click(screen.getByText('report an issue'));
    await userEvent.click(screen.getByText('submit'));
    await waitFor(() =>
      expect(screen.getByText(/thanks/)).toBeInTheDocument()
    );
  });

  it('shows error message when submit fails', async () => {
    vi.mocked(suggestionService.submitSuggestion).mockRejectedValue(
      new Error('network error')
    );
    render(<EditSuggestion placeId="p1" placeName="test toilet" userId="user1" />);
    await userEvent.click(screen.getByText('report an issue'));
    await userEvent.click(screen.getByText('submit'));
    await waitFor(() =>
      expect(screen.getByText('network error')).toBeInTheDocument()
    );
  });

  it('passes userId=null as anonymous when not signed in', async () => {
    render(<EditSuggestion placeId="p1" placeName="test toilet" userId={null} />);
    await userEvent.click(screen.getByText('report an issue'));
    await userEvent.click(screen.getByText('submit'));
    await waitFor(() =>
      expect(suggestionService.submitSuggestion).toHaveBeenCalledWith(
        'p1', 'test toilet', expect.any(String), expect.any(String), null
      )
    );
  });
});
