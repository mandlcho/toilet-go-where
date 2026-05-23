import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FavoriteButton from '../../components/FavoriteButton';
import * as favoritesService from '../../services/favoritesService';
import type { Place } from '../../types';

vi.mock('../../services/favoritesService', () => ({
  isFavorited: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));

const mockPlace: Place = {
  id: 'toilet-1',
  name: 'test toilet',
  location: { lat: 1.3, lng: 103.8 },
  category: 'toilet',
};

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(favoritesService.isFavorited).mockResolvedValue(false);
    vi.mocked(favoritesService.addFavorite).mockResolvedValue(undefined);
    vi.mocked(favoritesService.removeFavorite).mockResolvedValue(undefined);
  });

  it('renders a button', () => {
    render(<FavoriteButton place={mockPlace} userId={null} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('is disabled when userId is null', () => {
    render(<FavoriteButton place={mockPlace} userId={null} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is enabled after isFavorited resolves when userId is provided', async () => {
    render(<FavoriteButton place={mockPlace} userId="user1" />);
    await waitFor(() =>
      expect(screen.getByRole('button')).not.toBeDisabled()
    );
  });

  it('calls isFavorited with userId and placeId on mount', async () => {
    render(<FavoriteButton place={mockPlace} userId="user1" />);
    await waitFor(() =>
      expect(favoritesService.isFavorited).toHaveBeenCalledWith('user1', 'toilet-1')
    );
  });

  it('calls addFavorite when tapped while not favorited', async () => {
    vi.mocked(favoritesService.isFavorited).mockResolvedValue(false);
    render(<FavoriteButton place={mockPlace} userId="user1" />);
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
    await userEvent.click(screen.getByRole('button'));
    expect(favoritesService.addFavorite).toHaveBeenCalledWith('user1', mockPlace);
  });

  it('calls removeFavorite when tapped while already favorited', async () => {
    vi.mocked(favoritesService.isFavorited).mockResolvedValue(true);
    render(<FavoriteButton place={mockPlace} userId="user1" />);
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
    await userEvent.click(screen.getByRole('button'));
    expect(favoritesService.removeFavorite).toHaveBeenCalledWith('user1', 'toilet-1');
  });

  it('aria-label changes from "favorite" to "unfavorite" after adding', async () => {
    vi.mocked(favoritesService.isFavorited).mockResolvedValue(false);
    render(<FavoriteButton place={mockPlace} userId="user1" />);
    await waitFor(() => expect(screen.getByLabelText('favorite')).toBeInTheDocument());
    await userEvent.click(screen.getByLabelText('favorite'));
    await waitFor(() =>
      expect(screen.getByLabelText('unfavorite')).toBeInTheDocument()
    );
  });
});
