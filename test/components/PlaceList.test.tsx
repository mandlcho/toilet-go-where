import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlaceList from '../../components/PlaceList';
import type { Toilet } from '../../types';

const mockPlaces: Toilet[] = [
  {
    id: '1',
    name: 'test toilet',
    location: { lat: 1.3, lng: 103.8 },
    address: '123 test street',
    category: 'toilet',
    fee: false,
    wheelchair: true,
    diaper: false,
  },
  {
    id: '2',
    name: 'another toilet',
    location: { lat: 1.31, lng: 103.81 },
    address: 'address not available',
    category: 'toilet',
  },
];

describe('PlaceList', () => {
  it('shows result count in header', () => {
    render(<PlaceList places={mockPlaces} userLocation={null} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('shows singular "result" for one item', () => {
    render(<PlaceList places={[mockPlaces[0]]} userLocation={null} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('renders each place name', () => {
    render(<PlaceList places={mockPlaces} userLocation={null} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('test toilet')).toBeInTheDocument();
    expect(screen.getByText('another toilet')).toBeInTheDocument();
  });

  it('shows empty state when no places', () => {
    render(<PlaceList places={[]} userLocation={null} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/no results/)).toBeInTheDocument();
  });

  it('calls onSelect with the place and onClose when a row is tapped', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<PlaceList places={mockPlaces} userLocation={null} onSelect={onSelect} onClose={onClose} />);
    await userEvent.click(screen.getByText('test toilet'));
    expect(onSelect).toHaveBeenCalledWith(mockPlaces[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when ✕ button is clicked', async () => {
    const onClose = vi.fn();
    render(<PlaceList places={mockPlaces} userLocation={null} onSelect={vi.fn()} onClose={onClose} />);
    await userEvent.click(screen.getByLabelText('close list'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "free" badge when fee === false', () => {
    render(<PlaceList places={[mockPlaces[0]]} userLocation={null} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('free')).toBeInTheDocument();
  });

  it('shows "accessible" badge when wheelchair === true', () => {
    render(<PlaceList places={[mockPlaces[0]]} userLocation={null} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('accessible')).toBeInTheDocument();
  });

  it('does not render "address not available" as visible text', () => {
    render(<PlaceList places={[mockPlaces[1]]} userLocation={null} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByText('address not available')).not.toBeInTheDocument();
  });
});
