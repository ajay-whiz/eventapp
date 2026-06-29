import {
  haversineDistanceKm,
  parseQueryCoordinates,
  resolveNearestDistanceKm,
} from './geo-distance.util';

export const LOCATION_RADIUS_KM = 50;

export type ListingItemWithLocations = {
  primaryLocation?: { lat?: number; lng?: number; distance?: number };
  locations?: Array<{ lat?: number; lng?: number; distance?: number }>;
  location?: { latitude?: number; longitude?: number };
  formData?: Record<string, any>;
  distance?: number;
};

export function hasLocationQuery(lat?: unknown, lng?: unknown): boolean {
  return parseQueryCoordinates(lat, lng) != null;
}

export function applyLocationRadiusListingFilter<T extends ListingItemWithLocations>(
  items: T[],
  lat?: unknown,
  lng?: unknown,
): Array<T & { distance: number }> {
  const queryCoords = parseQueryCoordinates(lat, lng);
  if (!queryCoords) {
    return items as Array<T & { distance: number }>;
  }

  const filtered: Array<T & { distance: number }> = [];

  for (const item of items) {
    const distance = resolveNearestDistanceKm(item, queryCoords.lat, queryCoords.lng);

    if (distance == null || distance > LOCATION_RADIUS_KM) {
      continue;
    }

    filtered.push({
      ...item,
      distance,
      primaryLocation: item.primaryLocation
        ? { ...item.primaryLocation, distance }
        : item.primaryLocation,
    } as T & { distance: number });
  }

  return filtered.sort((left, right) => left.distance - right.distance);
}

export function paginateInMemoryList<T>(
  items: T[],
  page: number,
  limit: number,
): {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} {
  const total = items.length;
  const skip = (page - 1) * limit;

  return {
    data: items.slice(skip, skip + limit),
    pagination: {
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}

// Re-export for callers that need normalized coordinates.
export { parseQueryCoordinates, haversineDistanceKm };
