import {
  DISTANCE_UNIT_KM,
  LOCATION_RADIUS_KM,
  LOCATION_RADIUS_METERS,
  metersToDistanceKm,
  parseQueryCoordinates,
  resolveNearestDistanceMeters,
} from './geo-distance.util';

export { LOCATION_RADIUS_KM, LOCATION_RADIUS_METERS };

export type ListingItemWithLocations = {
  primaryLocation?: { lat?: number; lng?: number; distance?: number; distanceUnit?: string };
  locations?: Array<{ lat?: number; lng?: number; distance?: number; distanceUnit?: string }>;
  location?: { latitude?: number; longitude?: number };
  formData?: Record<string, any>;
  distance?: number;
  distanceUnit?: string;
};

export function hasLocationQuery(lat?: unknown, lng?: unknown): boolean {
  return parseQueryCoordinates(lat, lng) != null;
}

export function applyLocationRadiusListingFilter<T extends ListingItemWithLocations>(
  items: T[],
  lat?: unknown,
  lng?: unknown,
): Array<T & { distance: number; distanceUnit: typeof DISTANCE_UNIT_KM }> {
  const queryCoords = parseQueryCoordinates(lat, lng);
  if (!queryCoords) {
    return items as Array<T & { distance: number; distanceUnit: typeof DISTANCE_UNIT_KM }>;
  }

  const filtered: Array<T & { distance: number; distanceUnit: typeof DISTANCE_UNIT_KM }> = [];

  for (const item of items) {
    const distanceMeters = resolveNearestDistanceMeters(
      item,
      queryCoords.lat,
      queryCoords.lng,
    );

    if (distanceMeters == null || distanceMeters > LOCATION_RADIUS_METERS) {
      continue;
    }

    const distance = metersToDistanceKm(distanceMeters);

    filtered.push({
      ...item,
      distance,
      distanceUnit: DISTANCE_UNIT_KM,
      primaryLocation: item.primaryLocation
        ? { ...item.primaryLocation, distance, distanceUnit: DISTANCE_UNIT_KM }
        : item.primaryLocation,
    } as T & { distance: number; distanceUnit: typeof DISTANCE_UNIT_KM });
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

export { parseQueryCoordinates, metersToDistanceKm, DISTANCE_UNIT_KM };
