import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhotoGallery from '../../components/PhotoGallery';
import * as photoService from '../../services/photoService';
import type { Photo } from '../../types';

vi.mock('../../services/photoService', () => ({
  getPhotos: vi.fn(),
  uploadPhoto: vi.fn(),
}));

const makePhoto = (id: string, url: string): Photo => ({
  id,
  toiletId: 't1',
  url,
  userId: 'u1',
  userName: 'Alice',
  createdAt: 1000,
});

describe('PhotoGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(photoService.getPhotos).mockResolvedValue([]);
    vi.mocked(photoService.uploadPhoto).mockResolvedValue(makePhoto('ph1', 'https://example.com/a.jpg'));
  });

  it('shows "no photos yet." when empty and not signed in', async () => {
    render(<PhotoGallery toiletId="t1" userId={null} userName={null} />);
    await waitFor(() =>
      expect(screen.getByText('no photos yet.')).toBeInTheDocument()
    );
  });

  it('shows "be the first!" when signed in with no photos', async () => {
    render(<PhotoGallery toiletId="t1" userId="u1" userName="Alice" />);
    await waitFor(() =>
      expect(screen.getByText(/be the first!/)).toBeInTheDocument()
    );
  });

  it('hides the upload button when not signed in', async () => {
    render(<PhotoGallery toiletId="t1" userId={null} userName={null} />);
    await waitFor(() =>
      expect(screen.queryByText('+ add photo')).not.toBeInTheDocument()
    );
  });

  it('shows the upload button when signed in', async () => {
    render(<PhotoGallery toiletId="t1" userId="u1" userName="Alice" />);
    await waitFor(() =>
      expect(screen.getByText('+ add photo')).toBeInTheDocument()
    );
  });

  it('renders a thumbnail for each photo', async () => {
    vi.mocked(photoService.getPhotos).mockResolvedValue([
      makePhoto('ph1', 'https://example.com/a.jpg'),
      makePhoto('ph2', 'https://example.com/b.jpg'),
    ]);
    render(<PhotoGallery toiletId="t1" userId="u1" userName="Alice" />);
    await waitFor(() => {
      const imgs = screen.getAllByAltText('toilet photo');
      expect(imgs).toHaveLength(2);
      expect(imgs[0]).toHaveAttribute('src', 'https://example.com/a.jpg');
    });
  });

  it('calls uploadPhoto and prepends the new photo', async () => {
    const newPhoto = makePhoto('ph3', 'https://example.com/c.jpg');
    vi.mocked(photoService.uploadPhoto).mockResolvedValue(newPhoto);
    render(<PhotoGallery toiletId="t1" userId="u1" userName="Alice" />);
    await waitFor(() => expect(screen.getByText('+ add photo')).toBeInTheDocument());

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    expect(photoService.uploadPhoto).toHaveBeenCalledWith('t1', 'u1', 'Alice', file);
    await waitFor(() => {
      expect(screen.getByAltText('toilet photo')).toHaveAttribute(
        'src',
        'https://example.com/c.jpg'
      );
    });
  });

  it('shows an error message when upload fails', async () => {
    vi.mocked(photoService.uploadPhoto).mockRejectedValue(new Error('storage unavailable'));
    render(<PhotoGallery toiletId="t1" userId="u1" userName="Alice" />);
    await waitFor(() => expect(screen.getByText('+ add photo')).toBeInTheDocument());

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() =>
      expect(screen.getByText('storage unavailable')).toBeInTheDocument()
    );
  });
});
