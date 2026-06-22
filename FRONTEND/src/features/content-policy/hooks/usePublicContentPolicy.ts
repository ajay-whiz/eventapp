import { useEffect, useState } from 'react';
import api from '../../../axios';
import { API_ROUTES } from '../../../constants/routes';
import { resolveContentPolicyCategory } from '../utils/contentPolicySlugs';

export type PublicContentPolicy = {
  title: string;
  content: string;
  updatedAt?: string;
};

function normalizePublicContentPolicy(raw: any): PublicContentPolicy | null {
  if (!raw?.content) return null;

  return {
    title: raw.title ?? '',
    content: raw.content,
    updatedAt: raw.updatedAt,
  };
}

type UsePublicContentPolicyResult = {
  policy: PublicContentPolicy | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
};

export function usePublicContentPolicy(slug?: string): UsePublicContentPolicyResult {
  const [policy, setPolicy] = useState<PublicContentPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setPolicy(null);
      setLoading(false);
      setNotFound(true);
      setError(null);
      return;
    }

    let cancelled = false;
    const category = resolveContentPolicyCategory(slug);

    const load = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setPolicy(null);

      try {
        const response = await api.get(
          `${API_ROUTES.CONTENT_POLICIES}/category/${category}`,
        );
        const raw = response.data?.data ?? response.data;
        const normalized = normalizePublicContentPolicy(raw);

        if (cancelled) return;

        if (!normalized) {
          setNotFound(true);
          return;
        }

        setPolicy(normalized);
      } catch (err: any) {
        if (cancelled) return;

        const status = err?.response?.status;
        if (status === 404) {
          setNotFound(true);
          return;
        }

        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Failed to load content. Please try again later.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { policy, loading, error, notFound };
}
