import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Pencil, Trash2, Images } from 'lucide-react';
import { Button } from '../atoms/Button';
import { InputGroup } from '../molecules/InputGroup';
import MultiImageUpload, { type ImageFile } from '../atoms/MultiImageUpload';
import { ConfirmModal } from '../molecules/ConfirmModal';
import { useToast } from '../atoms/Toast';
import { IMAGE_BASE_URL } from '../../config/api';
import {
  createAlbum,
  deleteAlbum,
  fetchAlbums,
  updateAlbum,
  uploadListingImage,
  type Album,
  type ListingEntityType,
} from '../../services/albumService';

interface AlbumManagementModalProps {
  isOpen: boolean;
  entityType: ListingEntityType;
  entityId: string;
  entityName: string;
  onClose: () => void;
}

const resolveImageSrc = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${IMAGE_BASE_URL}${url}`;
  return url;
};

const urlsFromImages = (images: ImageFile[]): string[] =>
  images
    .map((img) => {
      if (typeof img.url === 'string' && img.url.trim()) {
        return img.url.trim();
      }
      if (img.url && typeof img.url === 'object' && 'imageUrl' in img.url) {
        const nested = (img.url as { imageUrl?: string }).imageUrl;
        if (typeof nested === 'string' && nested.trim()) {
          return nested.trim();
        }
      }
      if (img.preview?.startsWith('http')) {
        return img.preview;
      }
      return '';
    })
    .filter((url) => Boolean(url) && !url.startsWith('data:'));

const toImageItems = (urls: string[]): ImageFile[] =>
  urls.map((url, index) => ({
    id: `album-img-${index}-${url.slice(-12)}`,
    name: url.split('/').pop() || `image-${index + 1}`,
    url: resolveImageSrc(url),
    uploaded: true,
  }));

const AlbumManagementModal: React.FC<AlbumManagementModalProps> = ({
  isOpen,
  entityType,
  entityId,
  entityName,
  onClose,
}) => {
  const toast = useToast();
  const uploadingImageIdsRef = useRef<Set<string>>(new Set());

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [albumName, setAlbumName] = useState('');
  const [formImages, setFormImages] = useState<ImageFile[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetForm = useCallback(() => {
    setEditingAlbumId(null);
    setAlbumName('');
    setFormImages([]);
  }, []);

  const loadAlbums = useCallback(async () => {
    if (!entityId) return;

    setLoadingAlbums(true);
    try {
      const data = await fetchAlbums(entityType, entityId);
      setAlbums(data);
    } catch {
      // toast.error('Unable to load albums. Please try again.');
    } finally {
      setLoadingAlbums(false);
    }
    // toast from useToast() is recreated each render; omit from deps to avoid effect loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, entityType]);

  useEffect(() => {
    if (!isOpen) return;

    resetForm();

    let cancelled = false;

    (async () => {
      setLoadingAlbums(true);
      try {
        const data = await fetchAlbums(entityType, entityId);
        if (!cancelled) {
          setAlbums(data);
        }
      } catch {
        if (!cancelled) {
          // toast.error('Unable to load albums. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoadingAlbums(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entityId, entityType]);

  const handleImageUpload = async (images: ImageFile[]) => {
    const pendingImages = images.filter(
      (img) => img.file && !img.url && !uploadingImageIdsRef.current.has(img.id),
    );

    if (pendingImages.length === 0) {
      return;
    }

    pendingImages.forEach((img) => uploadingImageIdsRef.current.add(img.id));
    setUploadingImages(true);

    try {
      const uploadedById = new Map<string, ImageFile>();

      await Promise.all(
        pendingImages.map(async (img) => {
          const imageUrl = await uploadListingImage(entityType, img.file as File);
          uploadedById.set(img.id, {
            ...img,
            url: resolveImageSrc(imageUrl),
            uploaded: true,
          });
        }),
      );

      setFormImages(images.map((img) => uploadedById.get(img.id) || img));
    } catch {
      toast.error('Unable to upload images. Please try again.');
    } finally {
      pendingImages.forEach((img) => uploadingImageIdsRef.current.delete(img.id));
      setUploadingImages(false);
    }
  };

  const handleImagesChange = (images: ImageFile[]) => {
    setFormImages(images);

    const hasNewFiles = images.some((img) => img.file && !img.url && !img.uploaded);
    if (hasNewFiles) {
      void handleImageUpload(images);
    }
  };

  const handleEditAlbum = (album: Album) => {
    setEditingAlbumId(album.id);
    setAlbumName(album.name);
    setFormImages(toImageItems(album.images || []));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!albumName.trim()) {
      toast.error('Album name is required');
      return;
    }

    if (uploadingImages) {
      toast.error('Please wait for images to finish uploading');
      return;
    }

    const imageUrls = urlsFromImages(formImages);
    if (imageUrls.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setSaving(true);
    try {
      const payload = { name: albumName.trim(), images: imageUrls };

      if (editingAlbumId) {
        await updateAlbum(entityType, entityId, editingAlbumId, payload);
        toast.success('Album updated successfully');
      } else {
        await createAlbum(entityType, entityId, payload);
        toast.success('Album created successfully');
      }

      resetForm();
      await loadAlbums();
    } catch {
      toast.error('Unable to save album. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return;

    setDeleting(true);
    try {
      await deleteAlbum(entityType, entityId, albumToDelete.id);
      toast.success('Album deleted successfully');

      if (editingAlbumId === albumToDelete.id) {
        resetForm();
      }

      setAlbumToDelete(null);
      await loadAlbums();
    } catch {
      toast.error('Unable to delete album. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Albums</h2>
              <p className="text-sm text-gray-500 mt-1">{entityName}</p>
            </div>
            <Button variant="muted" onClick={onClose} className="cursor-pointer">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Images className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Albums</h3>
                </div>

                {loadingAlbums ? (
                  <div className="py-10 text-center text-gray-500">Loading albums...</div>
                ) : albums.length === 0 ? (
                  <div className="py-10 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg">
                    No albums yet. Create one using the form.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                    {albums.map((album) => (
                      <div
                        key={album.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{album.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {album.imageCount ?? album.images?.length ?? 0} image(s)
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditAlbum(album)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setAlbumToDelete(album)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>

                        {album.images?.length > 0 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto">
                            {album.images.slice(0, 4).map((image, index) => (
                              <img
                                key={`${album.id}-${index}`}
                                src={resolveImageSrc(image)}
                                alt={`${album.name} ${index + 1}`}
                                className="w-16 h-16 rounded-md object-cover border border-gray-200 shrink-0"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingAlbumId ? 'Edit Album' : 'Create Album'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <InputGroup
                    connected={false}
                    label="Album Name"
                    name="albumName"
                    id="albumName"
                    value={albumName}
                    onChange={(e) => setAlbumName(e.target.value)}
                    placeholder="e.g. Wedding Album"
                    required
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Images <span className="text-red-500">*</span>
                    </label>
                    <MultiImageUpload
                      initialImages={formImages}
                      onImagesChange={handleImagesChange}
                    />
                    {uploadingImages && (
                      <p className="text-sm text-sky-600 mt-2">Uploading images...</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={saving || uploadingImages}
                    >
                      {saving
                        ? 'Saving...'
                        : editingAlbumId
                          ? 'Update Album'
                          : 'Create Album'}
                    </Button>
                    {editingAlbumId && (
                      <Button type="button" variant="muted" onClick={resetForm}>
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(albumToDelete)}
        onClose={() => setAlbumToDelete(null)}
        onConfirm={confirmDeleteAlbum}
        title="Delete Album"
        message={`Are you sure you want to delete "${albumToDelete?.name}"?`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
      />
    </>
  );
};

export default AlbumManagementModal;
