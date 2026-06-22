import React from 'react';
import { useParams } from 'react-router-dom';
import ProtectedRoute from '../../../router/ProtectedRoute';
import ContentPolicyForm from './ContentPolicyForm';
import ContentPolicyPublicPage from './ContentPolicyPublicPage';
import { isMongoObjectId } from '../utils/contentPolicySlugs';

/**
 * Resolves /content-policy/:slugOrId
 * - MongoDB id -> admin edit form (protected)
 * - slug (e.g. privacy-policy) -> public content page
 */
const ContentPolicyDynamicRoute: React.FC = () => {
  const { slugOrId = '' } = useParams<{ slugOrId: string }>();

  if (slugOrId === 'new') {
    return (
      <ProtectedRoute requiredFeature="content_policy" requiredPermission="write">
        <ContentPolicyForm />
      </ProtectedRoute>
    );
  }

  if (isMongoObjectId(slugOrId)) {
    return (
      <ProtectedRoute requiredFeature="content_policy" requiredPermission="write">
        <ContentPolicyForm />
      </ProtectedRoute>
    );
  }

  return <ContentPolicyPublicPage slug={slugOrId} />;
};

export default ContentPolicyDynamicRoute;
