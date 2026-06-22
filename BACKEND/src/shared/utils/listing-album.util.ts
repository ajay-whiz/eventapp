import { ObjectId } from 'mongodb';
import { CreateListingAlbumDto } from '../dto/listing-album.dto';
import { UpdateListingAlbumDto } from '../dto/listing-album.dto';

export type ListingAlbumRecord = {
  id: string;
  name: string;
  images: string[];
  imageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function buildListingAlbum(
  dto: CreateListingAlbumDto,
): ListingAlbumRecord {
  const now = new Date();
  const images = (dto.images || []).filter(Boolean);

  return {
    id: new ObjectId().toString(),
    name: dto.name.trim(),
    images,
    imageCount: images.length,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateListingAlbumRecord(
  album: ListingAlbumRecord,
  dto: UpdateListingAlbumDto,
): ListingAlbumRecord {
  const images = dto.images !== undefined ? dto.images.filter(Boolean) : album.images;

  return {
    ...album,
    name: dto.name !== undefined ? dto.name.trim() : album.name,
    images,
    imageCount: images.length,
    updatedAt: new Date(),
  };
}

export function getActiveAlbums(albums?: ListingAlbumRecord[]): ListingAlbumRecord[] {
  return (albums || []).filter((album) => album && album.isActive !== false);
}
