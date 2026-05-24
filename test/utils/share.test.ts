import { describe, it, expect, afterEach } from 'vitest';
import { encodeShareUrl, decodeShareParams, clearShareParams } from '../../utils/share';

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('encodeShareUrl', () => {
  it('includes id, lat, lng as query params', () => {
    const result = encodeShareUrl({ id: 'toilet-42', lat: 1.234567, lng: 103.987654 });
    const url = new URL(result);
    expect(url.searchParams.get('id')).toBe('toilet-42');
    expect(url.searchParams.get('lat')).toBe('1.234567');
    expect(url.searchParams.get('lng')).toBe('103.987654');
  });

  it('formats lat/lng to 6 decimal places', () => {
    const result = encodeShareUrl({ id: 'x', lat: 1.3, lng: 103.8 });
    const url = new URL(result);
    expect(url.searchParams.get('lat')).toBe('1.300000');
    expect(url.searchParams.get('lng')).toBe('103.800000');
  });

  it('includes cat=atm when category is atm', () => {
    const result = encodeShareUrl({ id: 'atm-1', lat: 1.3, lng: 103.8, category: 'atm' });
    expect(new URL(result).searchParams.get('cat')).toBe('atm');
  });

  it('omits cat param when category is not provided', () => {
    const result = encodeShareUrl({ id: 'toilet-1', lat: 1.3, lng: 103.8 });
    expect(new URL(result).searchParams.get('cat')).toBeNull();
  });
});

describe('decodeShareParams', () => {
  it('returns null when URL has no params', () => {
    expect(decodeShareParams()).toBeNull();
  });

  it('returns null when id is missing', () => {
    window.history.pushState({}, '', '?lat=1.3&lng=103.8');
    expect(decodeShareParams()).toBeNull();
  });

  it('returns null when lat is not a number', () => {
    window.history.pushState({}, '', '?id=t1&lat=abc&lng=103.8');
    expect(decodeShareParams()).toBeNull();
  });

  it('returns null when lng is not a number', () => {
    window.history.pushState({}, '', '?id=t1&lat=1.3&lng=xyz');
    expect(decodeShareParams()).toBeNull();
  });

  it('parses valid params into a ShareParams object, defaulting to toilet', () => {
    window.history.pushState({}, '', '?id=toilet-42&lat=1.234567&lng=103.987654');
    expect(decodeShareParams()).toEqual({
      id: 'toilet-42',
      lat: 1.234567,
      lng: 103.987654,
      category: 'toilet',
    });
  });

  it('parses cat=atm as category atm', () => {
    window.history.pushState({}, '', '?id=atm-1&lat=1.3&lng=103.8&cat=atm');
    expect(decodeShareParams()?.category).toBe('atm');
  });
});

describe('clearShareParams', () => {
  it('removes id, lat, lng, cat from the URL', () => {
    window.history.pushState({}, '', '?id=t1&lat=1.3&lng=103.8&cat=atm');
    clearShareParams();
    const p = new URLSearchParams(window.location.search);
    expect(p.get('id')).toBeNull();
    expect(p.get('lat')).toBeNull();
    expect(p.get('lng')).toBeNull();
    expect(p.get('cat')).toBeNull();
  });

  it('preserves unrelated params', () => {
    window.history.pushState({}, '', '?id=t1&lat=1.3&lng=103.8&other=keep');
    clearShareParams();
    const p = new URLSearchParams(window.location.search);
    expect(p.get('other')).toBe('keep');
  });
});
