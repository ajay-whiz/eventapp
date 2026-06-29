import { LocationService } from '@modules/location/location.service';
import { Location } from '@modules/location/entity/location.entity';
import { extractCityFromAddress } from './location-city.util';
import {
  DISTANCE_UNIT_KM,
  extractCoordinatesFromFormData,
  haversineDistanceMeters,
  hasUsableCoordinates,
  metersToDistanceKm,
  parseQueryCoordinates,
} from './geo-distance.util';

export type ListingDetailLocationItem = {
  id?: string;
  address: string;
  city?: string;
  lat: number;
  lng: number;
  pinTitle?: string;
  mapImageUrl?: string;
  distance?: number;
  distanceUnit?: string;
};

export type ListingDetailLocationsResult = {
  location: {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    pinTitle: string;
    mapImageUrl: string;
  };
  primaryLocation: ListingDetailLocationItem;
  locations: ListingDetailLocationItem[];
};

export function parseDetailLocationQuery(
  lat?: unknown,
  lng?: unknown,
): { lat: number; lng: number } | null {
  return parseQueryCoordinates(lat, lng);
}

function resolveLocationCity(
  location: Location,
  formData?: Record<string, any>,
): string {
  return (
    location.city?.trim() ||
    extractCityFromAddress(location.address) ||
    formData?.city?.trim() ||
    'City not available'
  );
}

function mapStoredLocation(
  location: Location,
  entityName: string,
  formData?: Record<string, any>,
): ListingDetailLocationItem {
  const lat = Number(location.latitude) || 0;
  const lng = Number(location.longitude) || 0;

  return {
    id: location.id?.toString(),
    address: location.address || 'Address not available',
    city: resolveLocationCity(location, formData),
    lat,
    lng,
    pinTitle: location.name || formData?.pinTitle || entityName,
    mapImageUrl: formData?.mapImageUrl || 'https://maps.googleapis.com/...',
  };
}

function buildFallbackLocation(
  entityName: string,
  formData?: Record<string, any>,
): ListingDetailLocationItem {
  const formCoords = extractCoordinatesFromFormData(formData);
  const lat = formCoords?.lat ?? 0;
  const lng = formCoords?.lng ?? 0;

  return {
    address:
      formData?.address ||
      formData?.location ||
      'Address not available',
    city:
      formData?.city?.trim() ||
      extractCityFromAddress(formData?.address || formData?.location) ||
      'City not available',
    lat,
    lng,
    pinTitle: formData?.pinTitle || entityName,
    mapImageUrl: formData?.mapImageUrl || 'https://maps.googleapis.com/...',
  };
}

function toLegacyLocation(primary: ListingDetailLocationItem) {
  return {
    address: primary.address,
    city: primary.city || 'City not available',
    latitude: primary.lat,
    longitude: primary.lng,
    pinTitle: primary.pinTitle || '',
    mapImageUrl: primary.mapImageUrl || 'https://maps.googleapis.com/...',
  };
}

export function groupLocationsByServiceId(
  locations: Location[],
): Map<string, Location[]> {
  const grouped = new Map<string, Location[]>();

  for (const location of locations) {
    if (!location.serviceId) continue;

    const bucket = grouped.get(location.serviceId) || [];
    bucket.push(location);
    grouped.set(location.serviceId, bucket);
  }

  return grouped;
}

export function buildListingDetailLocationsFromRecords(
  locationService: LocationService,
  storedLocations: Location[],
  params: {
    entityName: string;
    formData?: Record<string, any>;
    queryLat?: number;
    queryLng?: number;
  },
): ListingDetailLocationsResult {
  const { entityName, formData, queryLat, queryLng } = params;

  let locations: ListingDetailLocationItem[] = storedLocations
    .map((location) => mapStoredLocation(location, entityName, formData))
    .filter((location) => hasUsableCoordinates(location.lat, location.lng));

  if (locations.length === 0) {
    locations = [buildFallbackLocation(entityName, formData)];
  }

  const queryCoords = parseDetailLocationQuery(queryLat, queryLng);

  if (queryCoords) {
    locations = locations
      .map((location) => {
        if (!hasUsableCoordinates(location.lat, location.lng)) {
          return location;
        }

        return {
          ...location,
          distance: metersToDistanceKm(
            haversineDistanceMeters(
              queryCoords.lat,
              queryCoords.lng,
              location.lat,
              location.lng,
            ),
          ),
          distanceUnit: DISTANCE_UNIT_KM,
        };
      })
      .sort((left, right) => {
        if (left.distance == null && right.distance == null) return 0;
        if (left.distance == null) return 1;
        if (right.distance == null) return -1;
        return left.distance - right.distance;
      });
  }

  const primaryLocation = locations[0];

  return {
    location: toLegacyLocation(primaryLocation),
    primaryLocation,
    locations,
  };
}

export async function buildListingDetailLocations(
  locationService: LocationService,
  params: {
    serviceId: string;
    entityName: string;
    formData?: Record<string, any>;
    queryLat?: number;
    queryLng?: number;
  },
): Promise<ListingDetailLocationsResult> {
  const { serviceId, entityName, formData, queryLat, queryLng } = params;
  const storedLocations = await locationService.findAllByServiceId(serviceId);

  return buildListingDetailLocationsFromRecords(
    locationService,
    storedLocations,
    { entityName, formData, queryLat, queryLng },
  );
}
