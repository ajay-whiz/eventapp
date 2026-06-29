const EARTH_RADIUS_METERS = 6371000;

export function coerceCoordinate(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function hasUsableCoordinates(lat: number, lng: number): boolean {
  return isValidCoordinate(lat, lng) && !(lat === 0 && lng === 0);
}

export function parseQueryCoordinates(
  lat?: unknown,
  lng?: unknown,
): { lat: number; lng: number } | null {
  const parsedLat = coerceCoordinate(lat);
  const parsedLng = coerceCoordinate(lng);

  if (parsedLat == null || parsedLng == null) {
    return null;
  }

  if (!isValidCoordinate(parsedLat, parsedLng)) {
    return null;
  }

  return { lat: parsedLat, lng: parsedLng };
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = EARTH_RADIUS_METERS * c;

  return Math.round((meters / 1000) * 10) / 10;
}

function readCoordinatePair(
  source: Record<string, unknown> | null | undefined,
): { lat: number; lng: number } | null {
  if (!source || typeof source !== 'object') {
    return null;
  }

  const lat = coerceCoordinate(
    source.latitude ?? source.lat ?? source.Latitude ?? source.Lat,
  );
  const lng = coerceCoordinate(
    source.longitude ?? source.lng ?? source.Longitude ?? source.Lng,
  );

  if (lat == null || lng == null || !hasUsableCoordinates(lat, lng)) {
    return null;
  }

  return { lat, lng };
}

export function extractCoordinatesFromFormData(
  formData?: Record<string, any> | null,
): { lat: number; lng: number } | null {
  if (!formData) {
    return null;
  }

  const direct = readCoordinatePair(formData);
  if (direct) {
    return direct;
  }

  const nested = readCoordinatePair(formData.coordinates);
  if (nested) {
    return nested;
  }

  if (typeof formData.location === 'string') {
    const parts = formData.location.split(',').map((part: string) => parseFloat(part.trim()));
    if (parts.length === 2 && hasUsableCoordinates(parts[0], parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
  }

  if (Array.isArray(formData.fields)) {
    for (const field of formData.fields) {
      const value = field?.actualValue;
      if (!value) {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        const fieldCoords = readCoordinatePair(value as Record<string, unknown>);
        if (fieldCoords) {
          return fieldCoords;
        }
      }

      if (typeof value === 'string' && value.includes(',')) {
        const parts = value.split(',').map((part: string) => parseFloat(part.trim()));
        if (parts.length === 2 && hasUsableCoordinates(parts[0], parts[1])) {
          return { lat: parts[0], lng: parts[1] };
        }
      }
    }
  }

  return null;
}

export type CoordinatePoint = { lat: number; lng: number };

export function collectEntityCoordinatePoints(entity: {
  primaryLocation?: { lat?: number; lng?: number };
  locations?: Array<{ lat?: number; lng?: number }>;
  location?: { latitude?: number; longitude?: number };
  formData?: Record<string, any>;
}): CoordinatePoint[] {
  const points: CoordinatePoint[] = [];
  const seen = new Set<string>();

  const addPoint = (lat?: number, lng?: number) => {
    const parsedLat = coerceCoordinate(lat);
    const parsedLng = coerceCoordinate(lng);

    if (parsedLat == null || parsedLng == null || !hasUsableCoordinates(parsedLat, parsedLng)) {
      return;
    }

    const key = `${parsedLat.toFixed(6)}:${parsedLng.toFixed(6)}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    points.push({ lat: parsedLat, lng: parsedLng });
  };

  for (const location of entity.locations || []) {
    addPoint(location.lat, location.lng);
  }

  addPoint(entity.primaryLocation?.lat, entity.primaryLocation?.lng);
  addPoint(entity.location?.latitude, entity.location?.longitude);

  const formCoords = extractCoordinatesFromFormData(entity.formData);
  if (formCoords) {
    addPoint(formCoords.lat, formCoords.lng);
  }

  return points;
}

export function resolveNearestDistanceKm(
  entity: {
    primaryLocation?: { lat?: number; lng?: number };
    locations?: Array<{ lat?: number; lng?: number }>;
    location?: { latitude?: number; longitude?: number };
    formData?: Record<string, any>;
  },
  queryLat: number,
  queryLng: number,
): number | null {
  const points = collectEntityCoordinatePoints(entity);

  if (points.length === 0) {
    return null;
  }

  const distances = points.map((point) =>
    haversineDistanceKm(queryLat, queryLng, point.lat, point.lng),
  );

  return Math.min(...distances);
}
