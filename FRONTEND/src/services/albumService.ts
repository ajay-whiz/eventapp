import api from '../axios';
import { API_ROUTES } from '../constants/routes';

export type ListingEntityType = 'venue' | 'vendor';

export type Album = {
  id: string;
  name: string;
  images: string[];
  imageCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AlbumPayload = {
  name: string;
  images: string[];
};

const albumsPath = (entityType: ListingEntityType, entityId: string) =>
  entityType === 'venue'
    ? `/${API_ROUTES.VENUE}/${entityId}/albums`
    : `/${API_ROUTES.VENDORS}/${entityId}/albums`;

const uploadPath = (entityType: ListingEntityType) =>
  entityType === 'venue' ? `/${API_ROUTES.VENUE}/upload-image` : `/${API_ROUTES.VENDORS}/upload-image`;

function unwrap<T>(response: any): T {
  return response?.data?.data ?? response?.data;
}

export async function fetchAlbums(
  entityType: ListingEntityType,
  entityId: string,
): Promise<Album[]> {
  const response = await api.get(albumsPath(entityType, entityId));
  const data = unwrap<Album[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function createAlbum(
  entityType: ListingEntityType,
  entityId: string,
  payload: AlbumPayload,
): Promise<Album> {
  const response = await api.post(albumsPath(entityType, entityId), payload);
  return unwrap<Album>(response);
}

export async function updateAlbum(
  entityType: ListingEntityType,
  entityId: string,
  albumId: string,
  payload: AlbumPayload,
): Promise<Album> {
  const response = await api.patch(
    `${albumsPath(entityType, entityId)}/${albumId}`,
    payload,
  );
  return unwrap<Album>(response);
}

export async function deleteAlbum(
  entityType: ListingEntityType,
  entityId: string,
  albumId: string,
): Promise<void> {
  await api.delete(`${albumsPath(entityType, entityId)}/${albumId}`);
}

function extractUploadImageUrl(response: unknown): string | null {
  const body = (response as { data?: unknown })?.data;

  const candidates: unknown[] = [];

  if (typeof body === 'string') {
    candidates.push(body);
  } else if (body && typeof body === 'object') {
    const outer = body as Record<string, unknown>;
    candidates.push(outer.data, outer.imageUrl, outer.url);

    const inner = outer.data;
    if (inner && typeof inner === 'object') {
      const nested = inner as Record<string, unknown>;
      candidates.push(nested.data, nested.imageUrl, nested.url);
    }
  }

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() && !candidate.startsWith('data:')) {
      return candidate.trim();
    }
  }

  return null;
}

export async function uploadListingImage(
  entityType: ListingEntityType,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(uploadPath(entityType), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const imageUrl = extractUploadImageUrl(response);

  if (!imageUrl) {
    throw new Error('UPLOAD_FAILED');
  }

  return imageUrl;
}
