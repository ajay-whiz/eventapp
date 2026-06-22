import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTING } from '../../../constants/routes';
import ContentViewer from '../../../components/common/ContentViewer';
import { usePublicContentPolicy } from '../hooks/usePublicContentPolicy';
import { formatPolicyUpdatedAt } from '../utils/contentPolicySlugs';

interface ContentPolicyPublicPageProps {
  slug: string;
}

const ContentPolicyPublicPage: React.FC<ContentPolicyPublicPageProps> = ({ slug }) => {
  const { policy, loading, error, notFound } = usePublicContentPolicy(slug);
  const pageTitle = policy?.title || slug.replace(/-/g, ' ');
  const updatedLabel = formatPolicyUpdatedAt(policy?.updatedAt);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = policy?.title
      ? `${policy.title} | Event Booking`
      : `${pageTitle} | Event Booking`;

    let meta = document.querySelector('meta[name="description"]');
    const hadMeta = Boolean(meta);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    const previousDescription = meta.getAttribute('content') || '';
    meta.setAttribute(
      'content',
      policy?.title
        ? `Read our ${policy.title}.`
        : `Public ${pageTitle} information.`,
    );

    return () => {
      document.title = previousTitle;
      if (hadMeta) {
        meta?.setAttribute('content', previousDescription);
      } else {
        meta?.remove();
      }
    };
  }, [policy?.title, pageTitle]);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:py-10">
      <article className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <header className="px-5 sm:px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-sky-600 font-semibold">
              Legal & Policies
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-1 capitalize">
              {pageTitle}
            </h1>
            {updatedLabel && (
              <p className="text-sm text-gray-500 mt-2">
                Last updated: <time dateTime={policy?.updatedAt}>{updatedLabel}</time>
              </p>
            )}
          </div>
        </header>

        <section className="p-5 sm:p-6" aria-live="polite">
          {loading && (
            <div
              className="flex items-center justify-center py-16 text-gray-500"
              role="status"
              aria-label="Loading content"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mr-3" />
              Loading content...
            </div>
          )}

          {!loading && error && (
            <div
              className="rounded-lg bg-red-50 border border-red-100 px-4 py-4 text-red-700 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {!loading && !error && notFound && (
            <div className="text-center py-16 px-4">
              <h2 className="text-lg font-semibold text-gray-900">Content not found</h2>
              <p className="text-gray-500 mt-2 text-sm">
                The requested policy page does not exist or has no published content yet.
              </p>
            </div>
          )}

          {!loading && !error && !notFound && policy?.content && (
            <ContentViewer
              content={policy.content}
              className="border-0 bg-transparent p-0"
              maxHeight="none"
            />
          )}
        </section>
      </article>
    </main>
  );
};

export default ContentPolicyPublicPage;
