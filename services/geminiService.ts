import type { Location, Toilet } from '../types';

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat: number;
  lon: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:postcode'?: string;
    'addr:city'?: string;
    railway?: string;
    toilets?: string;
    amenity?: string;
    fee?: string;
    wheelchair?: string;
    diaper?: string;
  };
  nodes?: number[];
}

export async function findToilets(location: Location): Promise<Toilet[]> {
  const bboxDelta = 0.05; 
  const south = location.lat - bboxDelta;
  const west = location.lng - bboxDelta;
  const north = location.lat + bboxDelta;
  const east = location.lng + bboxDelta;

  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"="toilets"](${south},${west},${north},${east});
      way["amenity"="toilets"](${south},${west},${north},${east});
      relation["amenity"="toilets"](${south},${west},${north},${east});
      node["railway"="station"]["toilets"="yes"](${south},${west},${north},${east});
      way["railway"="station"]["toilets"="yes"](${south},${west},${north},${east});
      relation["railway"="station"]["toilets"="yes"](${south},${west},${north},${east});
    )->.features;
    node.features->.feature_nodes;
    (
      .feature_nodes <;
    )->.parents;
    (.features; .parents;);
    out center;
  `;
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  try {
    const response = await fetch(overpassUrl);
    if (!response.ok) {
      throw new Error(`overpass api failed with status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data && data.elements) {
      const elements: OverpassElement[] = data.elements;

      const parentNameMap = new Map<number, string>();
      const ways = elements.filter(e => e.type === 'way' && e.tags?.name && e.nodes);
      for (const way of ways) {
        for (const nodeId of way.nodes!) {
          if (!parentNameMap.has(nodeId)) {
            parentNameMap.set(nodeId, way.tags!.name!);
          }
        }
      }
      
      const toiletElements = elements.filter(e => 
        e.tags?.amenity === 'toilets' || (e.tags?.railway === 'station' && e.tags?.toilets === 'yes')
      );

      return toiletElements.map((element: OverpassElement): Toilet => {
        const loc = {
            lat: element.center?.lat || element.lat,
            lng: element.center?.lon || element.lon
        };
        const addressParts = [
            element.tags?.['addr:street'],
            element.tags?.['addr:housenumber'],
            element.tags?.['addr:postcode'],
            element.tags?.['addr:city']
        ].filter(Boolean);
        
        let name = 'public toilet';
        let housedIn: string | undefined = undefined;
        
        if (element.tags?.railway === 'station') {
          name = element.tags.name ? `${element.tags.name} station toilet` : 'station toilet';
        } else if (element.tags?.name) {
          name = element.tags.name;
        }

        if (element.type === 'node' && parentNameMap.has(element.id)) {
            housedIn = parentNameMap.get(element.id)!;
        }
        
        const address = addressParts.length > 0 ? addressParts.join(', ') : 'address not available';

        return {
          id: element.id.toString(),
          name: name.toLowerCase(),
          location: loc,
          address: address.toLowerCase(),
          housedIn: housedIn?.toLowerCase(),
          fee: element.tags?.fee === 'no' || element.tags?.fee === '0',
          wheelchair: element.tags?.wheelchair === 'yes',
          diaper: element.tags?.diaper === 'yes',
        };
      });
    }
    return [];

  } catch (error) {
    console.error("error finding toilets with openstreetmap api:", error);
    throw new Error("failed to find nearby toilets from openstreetmap.");
  }
}

export async function reverseGeocode(location: Location): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&addressdetails=1`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`nominatim api failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.address) {
      const adr = data.address;
      const parts = [];
      if (adr.house_number) parts.push(adr.house_number);
      if (adr.road) parts.push(adr.road);
      if (adr.suburb) parts.push(adr.suburb);
      
      if (adr.city && adr.city.toLowerCase() === 'singapore') {
        if (adr.postcode) {
          parts.push(`singapore ${adr.postcode}`);
        } else {
          parts.push('singapore');
        }
      } else {
        if (adr.city) parts.push(adr.city);
        if (adr.postcode) parts.push(adr.postcode);
      }
      
      const uniqueAddressParts = [...new Set(parts)];

      if (uniqueAddressParts.length > 0) {
          return uniqueAddressParts.join(', ').toLowerCase();
      }
    }
    
    if (data.display_name) {
      return data.display_name.toLowerCase();
    }
    
    if (data.error) {
      console.error("nominatim api error:", data.error);
      return `location lookup failed: ${data.error}`.toLowerCase();
    } 
    
    return "could not determine address";

  } catch (error) {
    console.error("error with openstreetmap reverse geocoding:", error);
    return "unknown location (network error)";
  }
}