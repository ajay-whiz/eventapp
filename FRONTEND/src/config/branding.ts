const envLogo = import.meta.env.VITE_APP_LOGO_URL as string | undefined;
const envAppName = import.meta.env.VITE_APP_NAME as string | undefined;

export const APP_BRANDING = {
  logoSrc: envLogo?.trim() || '/assets/images/logo.svg',
  logoAlt: envAppName?.trim() || 'WhizCloud Events',
  appName: envAppName?.trim() || 'WhizCloud Events',
};
