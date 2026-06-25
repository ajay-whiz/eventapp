import React, { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button } from '../../../components/atoms/Button';
import { FeaturePermissionTable } from '../../../components/common/FeaturePermissionTable';
import { enterpriseSchema, type EnterpriseSchemaType } from '../schemas/enterprise.schema';
import type { Enterprise, EnterpriseFeature } from '../../../types/Enterprise';
import type { Role } from '../../../types/User';
import { useEnterpriseActions } from '../hooks/useEnterpriseActions';

type EnterprisePermissionsModalProps = {
  enterprise: Enterprise;
  features: Role[];
  loading: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const EnterprisePermissionsModal: React.FC<EnterprisePermissionsModalProps> = ({
  enterprise,
  features,
  loading,
  onClose,
  onSaved,
}) => {
  const { updateEnterprise } = useEnterpriseActions();

  const defaultFeatures = useMemo(() => {
    return (features || []).map((feature) => {
      const existing = enterprise.features?.find(
        (item: EnterpriseFeature) => String(item.featureId) === String(feature.id),
      );
      return {
        featureId: String(feature.id),
        permissions: {
          view: existing?.permissions?.view ?? false,
          read: existing?.permissions?.read ?? false,
          write: existing?.permissions?.write ?? false,
          admin: existing?.permissions?.admin ?? false,
        },
      };
    });
  }, [enterprise, features]);

  const methods = useForm<EnterpriseSchemaType>({
    resolver: zodResolver(enterpriseSchema),
    defaultValues: {
      firstName: enterprise.firstName || '',
      lastName: enterprise.lastName || '',
      email: enterprise.email || '',
      countryCode: enterprise.countryCode || '',
      phoneNumber: enterprise.phoneNumber || '',
      enterpriseName: enterprise.enterpriseName || '',
      description: enterprise.description || '',
      address: enterprise.address || '',
      city: enterprise.city || '',
      state: enterprise.state || '',
      pincode: enterprise.pincode || '',
      features: defaultFeatures,
    },
  });

  const { handleSubmit, reset, formState } = methods;

  useEffect(() => {
    reset({
      firstName: enterprise.firstName || '',
      lastName: enterprise.lastName || '',
      email: enterprise.email || '',
      countryCode: enterprise.countryCode || '',
      phoneNumber: enterprise.phoneNumber || '',
      enterpriseName: enterprise.enterpriseName || '',
      description: enterprise.description || '',
      address: enterprise.address || '',
      city: enterprise.city || '',
      state: enterprise.state || '',
      pincode: enterprise.pincode || '',
      features: defaultFeatures,
    });
  }, [enterprise, defaultFeatures, reset]);

  const onSubmit = async (data: EnterpriseSchemaType) => {
    const enterpriseKey = enterprise.key || enterprise.id;
    await updateEnterprise(enterpriseKey, data);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assign Permissions</h2>
            <p className="text-sm text-gray-500 mt-1">
              {enterprise.enterpriseName} — update existing permissions or assign new ones
            </p>
          </div>
          <Button variant="muted" type="button" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
                <span className="ml-3 text-gray-600">Loading permissions...</span>
              </div>
            ) : (
              <FeaturePermissionTable features={features} name="features" />
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button type="button" variant="muted" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading || formState.isSubmitting}>
                {formState.isSubmitting ? 'Saving...' : 'Update Permissions'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default EnterprisePermissionsModal;
