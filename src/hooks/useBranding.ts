import { useBrandingContext } from '../context/BrandingContext';
export type { Branding } from '../context/BrandingContext';

export function useBranding() {
  return useBrandingContext();
}
