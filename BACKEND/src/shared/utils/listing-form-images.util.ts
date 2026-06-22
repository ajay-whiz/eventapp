function extractUrlFromImageItem(item: unknown): string | null {
  if (!item) return null;

  if (typeof item === 'string') {
    return item.trim().startsWith('http') ? item.trim() : null;
  }

  if (typeof item !== 'object') return null;

  const imageItem = item as {
    url?: string | { imageUrl?: string };
    name?: string;
  };

  if (
    imageItem.url &&
    typeof imageItem.url === 'object' &&
    typeof imageItem.url.imageUrl === 'string' &&
    imageItem.url.imageUrl.startsWith('http')
  ) {
    return imageItem.url.imageUrl;
  }

  if (typeof imageItem.url === 'string' && imageItem.url.startsWith('http')) {
    return imageItem.url;
  }

  if (typeof imageItem.name === 'string' && imageItem.name.startsWith('http')) {
    return imageItem.name;
  }

  return null;
}

function isImageUploadField(field: {
  type?: string;
  name?: string;
  actualValue?: unknown;
}): boolean {
  if (!field?.actualValue) return false;

  const isMultiImageUpload = field.type === 'MultiImageUpload';
  const hasImageInName = field.name?.toLowerCase().includes('image') ?? false;

  if (!isMultiImageUpload && !hasImageInName) return false;

  return Array.isArray(field.actualValue) && field.actualValue.length > 0;
}

export function extractImagesFromFormData(entity: {
  imageUrl?: string;
  formData?: {
    imageUrl?: string;
    images?: unknown[];
    portfolio?: unknown[];
    fields?: Array<{
      type?: string;
      name?: string;
      actualValue?: unknown;
    }>;
  };
}): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const addUrl = (url: string | null | undefined) => {
    if (!url || typeof url !== 'string') return;

    const trimmed = url.trim();
    if (!trimmed.startsWith('http') || seen.has(trimmed)) return;

    seen.add(trimmed);
    urls.push(trimmed);
  };

  if (entity?.formData?.fields && Array.isArray(entity.formData.fields)) {
    for (const field of entity.formData.fields) {
      if (!isImageUploadField(field)) continue;

      for (const item of field.actualValue as unknown[]) {
        addUrl(extractUrlFromImageItem(item));
      }
    }
  }

  if (Array.isArray(entity?.formData?.images)) {
    for (const item of entity.formData.images) {
      addUrl(
        typeof item === 'string' ? item : extractUrlFromImageItem(item),
      );
    }
  }

  if (Array.isArray(entity?.formData?.portfolio)) {
    for (const item of entity.formData.portfolio) {
      addUrl(
        typeof item === 'string' ? item : extractUrlFromImageItem(item),
      );
    }
  }

  addUrl(entity?.formData?.imageUrl);
  addUrl(entity?.imageUrl);

  return urls;
}

export function extractPrimaryImageFromFormData(entity: {
  imageUrl?: string;
  formData?: {
    imageUrl?: string;
    images?: unknown[];
    portfolio?: unknown[];
    fields?: Array<{
      type?: string;
      name?: string;
      actualValue?: unknown;
    }>;
  };
}): string {
  return extractImagesFromFormData(entity)[0] || '';
}
