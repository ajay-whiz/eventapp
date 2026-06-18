import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../axios';
import { API_ROUTES, ROUTING } from '../../../constants/routes';
import ContentViewer from '../../../components/common/ContentViewer';
import type { ContentPolicy } from '../../../types/ContentPolicy';

const CATEGORY_LABELS: Record<string, string> = {
  'privacy-policy': 'Privacy Policy',
  'terms-of-service': 'Terms of Service',
};

interface ContentPolicyPublicPageProps {
  category: 'privacy-policy' | 'terms-of-service';
}

const ContentPolicyPublicPage: React.FC<ContentPolicyPublicPageProps> = ({ category }) => {
  const [policy, setPolicy] = useState<ContentPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`${API_ROUTES.CONTENT_POLICIES}/category/${category}`);
        if (!cancelled) {
          setPolicy(response.data?.data ?? response.data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Unable to load this policy right now.',
          );
        }
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
  }, [category]);

  const pageTitle = policy?.title || CATEGORY_LABELS[category] || 'Policy';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-sky-600 font-semibold">
              {CATEGORY_LABELS[category]}
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 mt-1">{pageTitle}</h1>
          </div>
          <Link
            to={ROUTING.LOGIN}
            className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline shrink-0"
          >
            Back to Login
          </Link>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mr-3" />
              Loading policy...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && policy?.content && (
            <ContentViewer
              content={policy.content}
              className="border-0 bg-transparent p-0"
              maxHeight="none"
            />
          )}

          {!loading && !error && !policy?.content && (
            <p className="text-gray-500 text-center py-12">No content available for this policy.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentPolicyPublicPage;
