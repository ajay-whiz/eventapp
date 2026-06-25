import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { CheckboxWithLabel } from '../molecules/CheckboxWithLabel';

type PermissionType = 'view' | 'read' | 'write' | 'admin';

export type FeaturePermission = {
  featureId: string;
  permissions: {
    view: boolean;
    read: boolean;
    write: boolean;
    admin: boolean;
  };
};

export type Feature = {
  id: string;
  name: string;
};

interface FeaturePermissionTableProps {
  features: Feature[];
  name: string;
}

const PERMISSION_COLUMNS: PermissionType[] = ['view', 'read', 'write', 'admin'];

export const FeaturePermissionTable: React.FC<FeaturePermissionTableProps> = ({
  features,
  name,
}) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const current = field.value || [];

        const updatePermission = (
          featureId: string,
          permission: PermissionType,
          checked: boolean
        ) => {
          const existingFeatureIndex = current.findIndex(
            (fp: FeaturePermission) => fp.featureId === featureId,
          );

          let updated: FeaturePermission[];

          const applyPermissionRules = (permissions: FeaturePermission['permissions']) => {
            const next = { ...permissions };

            if (permission === 'admin' && checked) {
              next.view = true;
              next.read = true;
              next.write = true;
              next.admin = true;
              return next;
            }

            if (permission === 'admin' && !checked) {
              next.admin = false;
              next.write = false;
              next.read = false;
              next.view = false;
              return next;
            }

            next[permission] = checked;

            if ((permission === 'read' || permission === 'write') && checked) {
              next.admin = false;
            }

            if (permission === 'read' && checked) {
              next.view = true;
            }

            if (permission === 'read' && !checked) {
              next.write = false;
              next.admin = false;
            }

            if (permission === 'view' && !checked) {
              next.read = false;
              next.write = false;
              next.admin = false;
            }

            return next;
          };

          if (existingFeatureIndex !== -1) {
            updated = current.map((fp: FeaturePermission) => {
              if (fp.featureId !== featureId) {
                return fp;
              }

              return {
                ...fp,
                permissions: applyPermissionRules({
                  view: fp.permissions?.view ?? false,
                  read: fp.permissions?.read ?? false,
                  write: fp.permissions?.write ?? false,
                  admin: fp.permissions?.admin ?? false,
                }),
              };
            });
          } else {
            updated = [
              ...current,
              {
                featureId,
                permissions: applyPermissionRules({
                  view: false,
                  read: false,
                  write: false,
                  admin: false,
                }),
              },
            ];
          }

          field.onChange(updated);
        };

        const isChecked = (featureId: string, permission: PermissionType) => {
          const found = current.find((fp: FeaturePermission) => fp.featureId === featureId);
          return found?.permissions?.[permission] ?? false;
        };

        const isDisabled = (featureId: string, permission: PermissionType) => {
          if (permission === 'view') {
            return isChecked(featureId, 'read') || isChecked(featureId, 'admin');
          }
          if (permission === 'read' || permission === 'write') {
            return isChecked(featureId, 'admin');
          }
          return false;
        };

        return (
          <div className="overflow-hidden rounded-md border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-md bg-white">
                <thead className="bg-gray-50 font-medium">
                  <tr className="bg-neutral-100">
                    <th className="px-4 py-3 font-semibold text-sm border-b border-neutral-300 w-[30%]">
                      Feature
                    </th>
                    {PERMISSION_COLUMNS.map((perm) => (
                      <th
                        key={perm}
                        className="px-4 py-3 font-semibold text-sm border-b border-neutral-300 text-center capitalize w-[15%]"
                      >
                        {perm}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(features) ? features : []).map((feature) => (
                    <tr key={feature.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-sm">{feature.name}</td>
                      {PERMISSION_COLUMNS.map((perm) => (
                        <td key={perm} className="text-center px-4 py-3 text-sm">
                          <CheckboxWithLabel
                            label=""
                            name={`${feature.id}-${perm}`}
                            id={`${feature.id}-${perm}`}
                            checked={isChecked(feature.id, perm)}
                            disabled={isDisabled(feature.id, perm)}
                            onChange={(checked: boolean) =>
                              updatePermission(feature.id, perm, checked)
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    />
  );
};
