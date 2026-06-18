import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileText, Pencil } from 'lucide-react';
import Layout from '../../../layouts/Layout';
import Breadcrumbs from '../../../components/common/BreadCrumb';
import { Button } from '../../../components/atoms/Button';
import { useContentPolicyActions } from '../../content-policy/hooks/useContentPolicyActions';
import { usePermissionsByUniqueId } from '../../../hooks/usePermissions';
import { ROUTING } from '../../../constants/routes';
import type { ContentPolicy } from '../../../types/ContentPolicy';
import SettingsPolicyEditor from './SettingsPolicyEditor';

type PolicyCategory = 'privacy-policy' | 'terms-of-service';

type PolicyCardConfig = {
  category: PolicyCategory;
  title: string;
  description: string;
  publicPath: string;
};

const POLICY_CARDS: PolicyCardConfig[] = [
  {
    category: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'Manage the privacy policy shown to users on login and public pages.',
    publicPath: ROUTING.PRIVACY_POLICY,
  },
  {
    category: 'terms-of-service',
    title: 'Terms of Service',
    description: 'Manage the terms of service agreement shown to users.',
    publicPath: ROUTING.TERMS_OF_SERVICE,
  },
];

const SettingsPage: React.FC = () => {
  const { fetchContentPolicyByCategory } = useContentPolicyActions();
  const { canEdit, isSuperAdmin } = usePermissionsByUniqueId('content_policy');
  const canManagePolicies = isSuperAdmin || canEdit;
  const [policies, setPolicies] = useState<Record<string, ContentPolicy | null>>({});
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<PolicyCategory | null>(null);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    const results: Record<string, ContentPolicy | null> = {};
    await Promise.all(
      POLICY_CARDS.map(async ({ category }) => {
        try {
          const policy = await fetchContentPolicyByCategory(category);
          results[category] = policy;
        } catch {
          results[category] = null;
        }
      }),
    );
    setPolicies(results);
    setLoading(false);
  }, [fetchContentPolicyByCategory]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const handleEditorSaved = async () => {
    setEditingCategory(null);
    await loadPolicies();
  };

  return (
    <Layout>
      <div className="max-w-4xl">
        <h2 className="text-xl font-semibold mb-2">Settings</h2>
        <Breadcrumbs />
        <p className="text-sm text-gray-500 mt-2 mb-6">
          Update legal documents and policies displayed to your users.
        </p>

        <div className="space-y-4">
          {POLICY_CARDS.map((card) => {
            const policy = policies[card.category];
            const updatedAt = policy?.updatedAt
              ? new Date(policy.updatedAt).toLocaleDateString()
              : null;
            const isEditing = editingCategory === card.category;

            return (
              <div
                key={card.category}
                className="bg-white border border-neutral-100 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                      {loading ? (
                        <p className="text-xs text-gray-400 mt-2">Loading status...</p>
                      ) : policy ? (
                        <p className="text-xs text-green-600 mt-2 font-medium">
                          Published{updatedAt ? ` · Last updated ${updatedAt}` : ''}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                          Not configured yet — create this policy to show it publicly.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {canManagePolicies && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          setEditingCategory(isEditing ? null : card.category)
                        }
                        disabled={loading}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        {isEditing ? 'Close' : policy ? 'Edit' : 'Create'}
                      </Button>
                    )}
                    <Link to={`/${card.publicPath}`} target="_blank" rel="noopener noreferrer">
                      <Button type="button" variant="secondary" size="sm" disabled={!policy}>
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>

                {isEditing && canManagePolicies && (
                  <SettingsPolicyEditor
                    category={card.category}
                    label={card.title}
                    policy={policy}
                    onCancel={() => setEditingCategory(null)}
                    onSaved={handleEditorSaved}
                  />
                )}
              </div>
            );
          })}
        </div>

        {canManagePolicies && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link
              to={`/${ROUTING.CONTENT_POLICY}`}
              className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
            >
              Manage all content policies →
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SettingsPage;
