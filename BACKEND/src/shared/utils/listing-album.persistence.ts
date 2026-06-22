import { NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { MongoRepository } from 'typeorm';
import {
  CreateListingAlbumDto,
  UpdateListingAlbumDto,
} from '../dto/listing-album.dto';
import {
  buildListingAlbum,
  getActiveAlbums,
  ListingAlbumRecord,
  updateListingAlbumRecord,
} from './listing-album.util';

type ListingWithAlbums = {
  id?: ObjectId;
  key?: string;
  albums?: ListingAlbumRecord[];
};

function getListingFilter(
  listing: ListingWithAlbums,
  listingId: string,
): Record<string, unknown> {
  if (listing.id) {
    return { _id: listing.id };
  }

  if (ObjectId.isValid(listingId)) {
    return { _id: new ObjectId(listingId) };
  }

  return { key: listingId };
}

export async function findListingByIdentifier<T extends ListingWithAlbums>(
  repo: MongoRepository<T>,
  listingId: string,
  notFoundLabel: string,
): Promise<T> {
  let listing: T | null = null;

  if (ObjectId.isValid(listingId)) {
    listing = await repo.findOneBy({ _id: new ObjectId(listingId) } as any);
  }

  if (!listing) {
    listing = await repo.findOneBy({ key: listingId } as any);
  }

  if (!listing) {
    throw new NotFoundException(`${notFoundLabel} not found`);
  }

  return listing;
}

export async function getListingAlbums<T extends ListingWithAlbums>(
  repo: MongoRepository<T>,
  listingId: string,
  notFoundLabel: string,
): Promise<ListingAlbumRecord[]> {
  const listing = await findListingByIdentifier(repo, listingId, notFoundLabel);
  return getActiveAlbums(listing.albums);
}

export async function addListingAlbum<T extends ListingWithAlbums>(
  repo: MongoRepository<T>,
  listingId: string,
  dto: CreateListingAlbumDto,
  notFoundLabel: string,
): Promise<ListingAlbumRecord> {
  const listing = await findListingByIdentifier(repo, listingId, notFoundLabel);
  const album = buildListingAlbum(dto);
  const filter = getListingFilter(listing, listingId);

  const result = await repo.updateOne(filter as any, {
    $push: { albums: album },
    $set: { updatedAt: new Date() },
  } as any);

  if (!result.matchedCount) {
    throw new NotFoundException(`${notFoundLabel} not found`);
  }

  return album;
}

export async function updateListingAlbum<T extends ListingWithAlbums>(
  repo: MongoRepository<T>,
  listingId: string,
  albumId: string,
  dto: UpdateListingAlbumDto,
  notFoundLabel: string,
): Promise<ListingAlbumRecord> {
  const listing = await findListingByIdentifier(repo, listingId, notFoundLabel);
  const albums = (listing.albums || []) as ListingAlbumRecord[];
  const existing = albums.find((album) => album.id === albumId);

  if (!existing) {
    throw new NotFoundException('Album not found');
  }

  const updated = updateListingAlbumRecord(existing, dto);
  const filter = {
    ...getListingFilter(listing, listingId),
    'albums.id': albumId,
  };

  const result = await repo.updateOne(filter as any, {
    $set: {
      'albums.$.name': updated.name,
      'albums.$.images': updated.images,
      'albums.$.imageCount': updated.imageCount,
      'albums.$.updatedAt': updated.updatedAt,
      updatedAt: new Date(),
    },
  } as any);

  if (!result.matchedCount) {
    throw new NotFoundException('Album not found');
  }

  return updated;
}

export async function deleteListingAlbum<T extends ListingWithAlbums>(
  repo: MongoRepository<T>,
  listingId: string,
  albumId: string,
  notFoundLabel: string,
): Promise<{ message: string }> {
  const listing = await findListingByIdentifier(repo, listingId, notFoundLabel);
  const exists = (listing.albums || []).some((album) => album.id === albumId);

  if (!exists) {
    throw new NotFoundException('Album not found');
  }

  const filter = getListingFilter(listing, listingId);
  const result = await repo.updateOne(filter as any, {
    $pull: { albums: { id: albumId } },
    $set: { updatedAt: new Date() },
  } as any);

  if (!result.matchedCount) {
    throw new NotFoundException(`${notFoundLabel} not found`);
  }

  return { message: 'Album deleted successfully' };
}
