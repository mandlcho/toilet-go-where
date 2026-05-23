import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConditionTags from '../../components/ConditionTags';
import * as tagService from '../../services/tagService';

vi.mock('../../services/tagService', () => ({
  getTags: vi.fn(),
  toggleTag: vi.fn(),
  TAG_LABELS: {
    has_soap: 'has soap',
    has_paper: 'has paper',
    clean: 'clean',
    hand_dryer: 'hand dryer',
    broken_lock: 'broken lock',
    out_of_order: 'out of order',
  },
  TAG_KEYS: ['has_soap', 'has_paper', 'clean', 'hand_dryer', 'broken_lock', 'out_of_order'],
}));

describe('ConditionTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tagService.getTags).mockResolvedValue([]);
    vi.mocked(tagService.toggleTag).mockResolvedValue(undefined);
  });

  it('renders all 6 tag labels after loading', async () => {
    render(<ConditionTags toiletId="t1" userId={null} />);
    await waitFor(() => {
      expect(screen.getByText('has soap')).toBeInTheDocument();
      expect(screen.getByText('clean')).toBeInTheDocument();
      expect(screen.getByText('broken lock')).toBeInTheDocument();
      expect(screen.getByText('out of order')).toBeInTheDocument();
    });
  });

  it('shows "sign in to vote" hint when userId is null', async () => {
    render(<ConditionTags toiletId="t1" userId={null} />);
    await waitFor(() =>
      expect(screen.getByText(/sign in to vote/)).toBeInTheDocument()
    );
  });

  it('hides "sign in to vote" when userId is provided', async () => {
    render(<ConditionTags toiletId="t1" userId="user1" />);
    await waitFor(() =>
      expect(screen.queryByText(/sign in to vote/)).not.toBeInTheDocument()
    );
  });

  it('shows vote count when votes exist', async () => {
    vi.mocked(tagService.getTags).mockResolvedValue([
      { id: 't1_has_soap', toiletId: 't1', tagKey: 'has_soap', votes: ['u1', 'u2'] },
    ]);
    render(<ConditionTags toiletId="t1" userId="u3" />);
    await waitFor(() =>
      expect(screen.getByText('has soap (2)')).toBeInTheDocument()
    );
  });

  it('applies active (blue) styles when current user has voted', async () => {
    vi.mocked(tagService.getTags).mockResolvedValue([
      { id: 't1_clean', toiletId: 't1', tagKey: 'clean', votes: ['user1'] },
    ]);
    render(<ConditionTags toiletId="t1" userId="user1" />);
    await waitFor(() => {
      const btn = screen.getByText('clean (1)').closest('button');
      expect(btn).toHaveClass('bg-blue-600');
    });
  });

  it('calls toggleTag and increments count optimistically when user votes', async () => {
    render(<ConditionTags toiletId="t1" userId="user1" />);
    await waitFor(() => expect(screen.getByText('has soap')).toBeInTheDocument());
    await userEvent.click(screen.getByText('has soap'));
    expect(tagService.toggleTag).toHaveBeenCalledWith('t1', 'has_soap', 'user1', false);
    expect(screen.getByText('has soap (1)')).toBeInTheDocument();
  });

  it('does not call toggleTag when userId is null', async () => {
    render(<ConditionTags toiletId="t1" userId={null} />);
    await waitFor(() => expect(screen.getByText('has soap')).toBeInTheDocument());
    await userEvent.click(screen.getByText('has soap'));
    expect(tagService.toggleTag).not.toHaveBeenCalled();
  });

  it('removes vote optimistically on second click', async () => {
    vi.mocked(tagService.getTags).mockResolvedValue([
      { id: 't1_clean', toiletId: 't1', tagKey: 'clean', votes: ['user1'] },
    ]);
    render(<ConditionTags toiletId="t1" userId="user1" />);
    await waitFor(() => expect(screen.getByText('clean (1)')).toBeInTheDocument());
    await userEvent.click(screen.getByText('clean (1)'));
    expect(tagService.toggleTag).toHaveBeenCalledWith('t1', 'clean', 'user1', true);
    expect(screen.getByText('clean')).toBeInTheDocument();
    expect(screen.queryByText('clean (1)')).not.toBeInTheDocument();
  });
});
