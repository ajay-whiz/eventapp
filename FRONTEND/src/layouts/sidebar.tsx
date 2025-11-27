import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { IMAGE_BASE_URL } from '../config/api';
import Tooltip from '../components/atoms/ToolTip';
import LogoutButton from '../features/auth/components/Auth/LogoutButton';
import { getUserDataFromStorage, isSuperAdmin } from '../utils/permissions';
import { getFeatureConfig, type MenuItemFromFeature } from '../config/featureMapping';
import { Settings } from 'lucide-react';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isExpanded: boolean;
  isActive: boolean;
  badge?: string | null;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  to,
  icon,
  label,
  isExpanded,
  isActive,
  badge,
}) => (
  <Link to={to} className="block">
  <Tooltip label={label} disabled={isExpanded /* no tooltip when text is visible */}>
    <div
      className={clsx(
        "relative flex items-center gap-2 p-2 mb-2 cursor-pointer group transition-colors rounded-lg",
        isActive ? "bg-sky-100 text-neutral-800 font-bold"
                 : "text-neutral-700 hover:bg-sky-100 hover:text-neutral-800",
        isExpanded ? "" : "justify-center"
      )}
    >
      {/* Icon */}
      <div className="w-6 h-6 flex items-center justify-center">{icon}</div>

      {/* Label only in expanded */}
      {isExpanded && (
        <span className="text-sm whitespace-nowrap transition-all duration-300 ease-in-out">
          {label}
        </span>
      )}

      {/* Badge only in expanded */}
      {badge && isExpanded && (
        <span className="ml-auto bg-sky-600 text-xs px-2 py-0.5 rounded-md whitespace-nowrap">
          {badge}
        </span>
      )}
    </div>
  </Tooltip>
</Link>
);






// ✅ SidebarFooter Component
const SidebarFooter = ({ isExpanded, user }: { isExpanded: boolean; user: any }) => {
  const getFileName = (path: string | null | undefined) => {
    if (!path || typeof path !== 'string') return '';
    return path.split(/[/\\]/).pop() || '';
  };
  const imagePath = user?.profileImage ? getFileName(user.profileImage) : '';
  const imageUrl = imagePath ? `${IMAGE_BASE_URL}/${imagePath.replace(/\\/g, '/')}` : '';

  return (
    <div className="border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between  px-2 py-2 rounded transition-colors">
      {isExpanded && (
        <>
        <div className="flex items-center gap-3">

            {imageUrl ? (
              <img
                src={imageUrl}
                alt="profile"
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  // Hide image if loading fails and show avatar instead
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-neutral-800">
                {user?.firstName} {user?.lastName}
              </p>
              {/* <p className="text-xs text-neutral-500">{user?.roles?.[0]?.name}</p> */}
            </div>
          </div>
          </>
        )}
        
        {!isExpanded && (
          <div className="flex justify-center mb-2">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="profile"
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  // Hide image if loading fails and show avatar instead
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>
        )}
        
        <LogoutButton />
      </div>
    </div>
  );
};

interface SidebarProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

// ✅ Main Sidebar Component
const Sidebar: React.FC<SidebarProps> = ({ isExpanded, toggleSidebar }) => {
  const location = useLocation();
  const user = useUser();

  const userData = getUserDataFromStorage();
  const isUserSuperAdmin = isSuperAdmin(userData);

  // Generate dynamic menu items based on user permissions from login API response
  const menuItems: MenuItemFromFeature[] = useMemo(() => {
    // Always start with Dashboard and Profile Setting
    const baseMenuItems: MenuItemFromFeature[] = [];
    
    // Always add Dashboard first
    const dashboardConfig = getFeatureConfig('dashboard');
    if (dashboardConfig) {
      baseMenuItems.push({
        to: dashboardConfig.route,
        label: dashboardConfig.defaultLabel,
        icon: dashboardConfig.icon,
        badge: null,
        feature: dashboardConfig.defaultLabel,
        uniqueId: dashboardConfig.uniqueId,
      });
    }
    
    // Add Form, Role, and Feature management for Super Admin only
    if (isUserSuperAdmin) {
      const superAdminFeatures = ['form_builder', 'role_management', 'feature_management'];
      superAdminFeatures.forEach(uniqueId => {
        const config = getFeatureConfig(uniqueId);
        if (config) {
          // Check if this feature is not already in the list (avoid duplicates)
          const alreadyExists = baseMenuItems.some(item => item.uniqueId === uniqueId);
          if (!alreadyExists) {
            baseMenuItems.push({
              to: config.route,
              label: config.defaultLabel,
              icon: config.icon,
              badge: null,
              feature: config.defaultLabel,
              uniqueId: config.uniqueId,
            });
          }
        }
      });
    }
    
    // Get features from login API response (from roles)
    const userFeatures = userData?.roles?.flatMap(role => role.features || []) || [];
    
    // Filter out dashboard, profile_setting, and super admin features to avoid duplicates
    // Also filter out features without uniqueId
    const filteredFeatures = userFeatures.filter(
      feature => feature && feature.uniqueId && 
      feature.uniqueId !== 'dashboard' && 
      feature.uniqueId !== 'profile_setting' &&
      !(isUserSuperAdmin && ['form_builder', 'role_management', 'feature_management'].includes(feature.uniqueId))
    );
    
    // Add features from login response only
    filteredFeatures.forEach(feature => {
      // Double-check uniqueId exists before proceeding
      if (!feature.uniqueId) {
        return; // Skip features without uniqueId
      }
      
      const config = getFeatureConfig(feature.uniqueId);
      if (config) {
        baseMenuItems.push({
          to: config.route,
          label: feature.name || 'Unnamed Feature', // Use API name from login response
          icon: config.icon,
          badge: null,
          feature: feature.name || 'Unnamed Feature',
          uniqueId: feature.uniqueId,
        });
      } else {
        // Fallback for unmapped features - ensure uniqueId exists before using replace
        const route = feature.uniqueId ? `/${feature.uniqueId.replace(/_/g, '-')}` : '/unknown';
        baseMenuItems.push({
          to: route,
          label: feature.name || 'Unnamed Feature',
          icon: <Settings size={24} />,
          badge: null,
          feature: feature.name || 'Unnamed Feature',
          uniqueId: feature.uniqueId || 'unknown',
        });
      }
    });
    
    // Always add Profile Setting at the end
    const profileConfig = getFeatureConfig('profile_setting');
    if (profileConfig) {
      baseMenuItems.push({
        to: profileConfig.route,
        label: profileConfig.defaultLabel,
        icon: profileConfig.icon,
        badge: null,
        feature: profileConfig.defaultLabel,
        uniqueId: profileConfig.uniqueId,
      });
    }

    return baseMenuItems;
  }, [userData, isUserSuperAdmin]);

  return (
    <aside
      className={clsx(
        'h-screen bg-white text-neutral-500 flex flex-col transition-all z-2 duration-300 ease-in-out fixed',
        isExpanded ? 'w-65' : 'w-16'
      )}
    >
      {/* Fixed Header - Logo Section */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3 ">
          <div className="flex items-center gap-2">
            <div className=" w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">
            <img src="/assets/images/smdashLogo.svg" alt="Dashboard" className="max-w-full dashboardLogo" />
            </div>
            {isExpanded && <span className="text-lg font-semibold">  <img src="/assets/images/dashlogo.svg" alt="Dashboard" className="max-w-full dashboardLogo" /></span>}
          </div>
        </div>
        <button
            onClick={toggleSidebar}
            className="z-1 text-white w-6 h-6 bg-sky-500 hover:bg-sky-600 flex items-center justify-center rounded-full transition-colors duration-200 shadow-sm absolute top-[80px] right-[-12px] cursor-pointer"
          >
            {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Scrollable Middle Section - Navigation Menu */}
      <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent overflow-x-hidden ">
        <nav className="mt-0 space-y-2">
          <div className={clsx({ 'p-4': isExpanded, 'p-2 py-4': !isExpanded })}>
            {/* Show only menu items from login API response (Dashboard, features from roles, and Profile) */}
            {menuItems.map((item) => (
              <SidebarLink
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isExpanded={isExpanded}
                isActive={location.pathname.startsWith(item.to)}
                badge={item.badge}
              />
            ))}
          </div>
          
        </nav>
      </div>

      {/* Fixed Footer - Logout Section */}
      <div className="flex-shrink-0">
        <SidebarFooter isExpanded={isExpanded} user={user} />
      </div>
    </aside>
  );
};

export default Sidebar;
