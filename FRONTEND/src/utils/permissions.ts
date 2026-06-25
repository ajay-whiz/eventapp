export interface UserRole {
  name: string;
  features?: Array<{
    id: string;
    name: string;
    uniqueId: string;
    permission?: {
      view?: boolean;
      read?: boolean;
      write?: boolean;
      admin?: boolean;
    };
  }>;
}

export interface UserData {
  roles?: UserRole[];
  enterpriseId?: string;
  organizationName?: string;
}

export const SUPER_ADMIN_ONLY_FEATURE_IDS = [
  'role_management',
  'feature_management',
  'enterprise_management',
  'content_policy',
] as const;

/** DB/API may use alternate uniqueIds for the same module */
const FEATURE_UNIQUE_ID_ALIASES: Record<string, string> = {
  booking__management: 'booking_management',
  booking_management: 'booking_management',
};

export const normalizeFeatureUniqueId = (uniqueId: string): string =>
  FEATURE_UNIQUE_ID_ALIASES[uniqueId] ?? uniqueId;

export const featureUniqueIdsMatch = (a: string, b: string): boolean =>
  normalizeFeatureUniqueId(a) === normalizeFeatureUniqueId(b);

export const isSuperAdminOnlyFeature = (uniqueId: string): boolean =>
  (SUPER_ADMIN_ONLY_FEATURE_IDS as readonly string[]).includes(uniqueId);

const normalizeRoleName = (name?: string): string =>
  (name ?? '').toLowerCase().trim().replace(/_/g, ' ');

/** Enterprise roles are named like SUPERTECH_ADMIN, ACME_ADMIN — not platform Super Admin */
export const isEnterpriseScopedAdminRole = (roleName?: string): boolean => {
  const normalized = (roleName ?? '').toLowerCase().trim();
  if (!normalized.endsWith('_admin')) {
    return false;
  }
  return normalized !== 'super_admin';
};

export const isPlatformSuperAdminRole = (role: UserRole): boolean => {
  const roleName = role.name?.toLowerCase().trim() ?? '';
  const normalized = normalizeRoleName(role.name);

  if (isEnterpriseScopedAdminRole(role.name)) {
    return false;
  }

  return (
    normalized === 'super admin' ||
    roleName === 'super_admin' ||
    roleName === 'superadmin' ||
    roleName === 'super-admin' ||
    role.name === 'Super Admin' ||
    role.name === 'SUPER_ADMIN' ||
    role.name === 'SuperAdmin'
  );
};

/**
 * Check if user is Super Admin (NOT regular Admin or enterprise admin)
 *
 * Platform Super Admin: "Super Admin" / "SUPER_ADMIN"
 * Enterprise admin roles like "SUPERTECH_ADMIN" are excluded
 */
export const isSuperAdmin = (userData: UserData | null): boolean => {
  if (!userData?.roles || !Array.isArray(userData.roles)) {
    return false;
  }

  return userData.roles.some((role: UserRole) => isPlatformSuperAdminRole(role));
};

/**
 * Check if user is regular Admin (NOT Super Admin)
 */
export const isRegularAdmin = (userData: UserData | null): boolean => {
  if (!userData?.roles || !Array.isArray(userData.roles)) {
    return false;
  }

  return userData.roles.some((role: UserRole) => {
    const roleName = role.name?.toLowerCase().trim();
    return (
      // Only exact "admin" matches, not "super admin"
      roleName === 'admin' && !roleName.includes('super')
    );
  });
};

/**
 * Get all Super Admin role names for verification
 */
export const getSuperAdminRoles = (userData: UserData | null): string[] => {
  if (!userData?.roles || !Array.isArray(userData.roles)) {
    return [];
  }

  return userData.roles
    .filter((role: UserRole) => isPlatformSuperAdminRole(role))
    .map((role: UserRole) => role.name);
};

/**
 * Get user role classification for debugging and display
 */
export const getUserRoleInfo = (userData: UserData | null): {
  isSuperAdmin: boolean;
  isRegularAdmin: boolean;
  allRoles: string[];
  accessLevel: 'Super Admin' | 'Admin' | 'User' | 'Unknown';
} => {
  const allRoles = userData?.roles?.map(role => role.name) || [];
  const isSuperAdminUser = isSuperAdmin(userData);
  const isRegularAdminUser = isRegularAdmin(userData);
  
  let accessLevel: 'Super Admin' | 'Admin' | 'User' | 'Unknown';
  if (isSuperAdminUser) {
    accessLevel = 'Super Admin';
  } else if (isRegularAdminUser) {
    accessLevel = 'Admin';
  } else if (allRoles.length > 0) {
    accessLevel = 'User';
  } else {
    accessLevel = 'Unknown';
  }

  return {
    isSuperAdmin: isSuperAdminUser,
    isRegularAdmin: isRegularAdminUser,
    allRoles,
    accessLevel
  };
};

/**
 * Get user permissions for a specific feature by name or uniqueId
 */
export const getFeaturePermissions = (
  userData: UserData | null,
  featureNameOrUniqueId: string
): {
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canResetPassword: boolean;
  hasAccess: boolean;
} => {
  // If Super Admin, grant all permissions
  if (isSuperAdmin(userData)) {
    return {
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canView: true,
      canResetPassword: true,
      hasAccess: true,
    };
  }

  // For regular users, check feature-specific permissions
  try {
    const roles = Array.isArray(userData?.roles) ? userData.roles : [];
    const matchedFeature = roles
      .flatMap((r: UserRole) => r.features || [])
      .find((f: any) => f.name === featureNameOrUniqueId || f.uniqueId === featureNameOrUniqueId);

    const hasView = !!matchedFeature?.permission?.view;
    const hasRead = !!matchedFeature?.permission?.read;
    const hasWrite = !!matchedFeature?.permission?.write;
    const hasAdmin = !!matchedFeature?.permission?.admin;

    const hasAnyPermission = hasView || hasRead || hasWrite || hasAdmin;

    return {
      canAdd: hasWrite || hasAdmin,
      canEdit: hasWrite || hasAdmin,
      canDelete: hasAdmin,
      canView: hasView || hasRead || hasWrite || hasAdmin,
      canResetPassword: hasWrite || hasAdmin,
      hasAccess: hasAnyPermission,
    };
  } catch (err) {
    return {
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canView: false,
      canResetPassword: false,
      hasAccess: false,
    };
  }
};

/**
 * Get user permissions by uniqueId specifically (new function)
 */
export const getFeaturePermissionsByUniqueId = (
  userData: UserData | null,
  uniqueId: string
): {
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canResetPassword: boolean;
  hasAccess: boolean;
} => {
  // If Super Admin, grant all permissions
  if (isSuperAdmin(userData)) {
    return {
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canView: true,
      canResetPassword: true,
      hasAccess: true,
    };
  }

  // For regular users, check feature-specific permissions by uniqueId
  try {
    const roles = Array.isArray(userData?.roles) ? userData.roles : [];
    const matchedFeature = roles
      .flatMap((r: UserRole) => r.features || [])
      .find((f: any) => featureUniqueIdsMatch(f.uniqueId ?? '', uniqueId));

    const hasView = !!matchedFeature?.permission?.view;
    const hasRead = !!matchedFeature?.permission?.read;
    const hasWrite = !!matchedFeature?.permission?.write;
    const hasAdmin = !!matchedFeature?.permission?.admin;

    const hasAnyPermission = hasView || hasRead || hasWrite || hasAdmin;

    return {
      canAdd: hasWrite || hasAdmin,
      canEdit: hasWrite || hasAdmin,
      canDelete: hasAdmin,
      canView: hasView || hasRead || hasWrite || hasAdmin,
      canResetPassword: hasWrite || hasAdmin,
      hasAccess: hasAnyPermission,
    };
  } catch (err) {
    return {
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canView: false,
      canResetPassword: false,
      hasAccess: false,
    };
  }
};

/**
 * Get all accessible features for user
 */
export const getAccessibleFeatures = (userData: UserData | null): string[] => {
  // If Super Admin, return all possible features
  if (isSuperAdmin(userData)) {
    return [
      'Dashboard',
      'User Management',
      'Role Management',
      'Feature Management',
      'Enterprise Management',
      'Form Builder',
      'Venue Category',
      'Venue Management',
      'Profile Setting',
      'Service Category',
      'Vendor Category',
      'Vendor Management',
    ];
  }

  // For regular users, filter based on permissions
  const featureNames: string[] =
    userData?.roles?.flatMap((role: UserRole) =>
      role?.features
        ?.filter(
          (feature: any) =>
            feature?.permission?.view ||
            feature?.permission?.read ||
            feature?.permission?.write ||
            feature?.permission?.admin
        )
        .map((feature: any) => feature.name)
    ) ?? [];

  return featureNames;
};

/**
 * Get user data from localStorage
 */
export const getUserDataFromStorage = (): UserData | null => {
  try {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    // Failed to parse user from localStorage
    return null;
  }
};
