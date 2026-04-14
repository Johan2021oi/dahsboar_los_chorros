import { useState } from 'react';

export interface Branding {
  appName: string;
  logoText: string;
  subtitle: string;
  logoImage?: string | null;
  phone?: string;
  phone2?: string;
  address?: string;
  email?: string;
}

const DEFAULT_BRANDING: Branding = {
  appName: 'BUSI',
  logoText: '💼',
  subtitle: 'GESTIÓN DE NEGOCIOS',
  logoImage: '/logo-square.png',
};

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(() => {
    const saved = localStorage.getItem('app_branding');
    return saved ? JSON.parse(saved) : DEFAULT_BRANDING;
  });

  const updateBranding = (newBranding: Partial<Branding>) => {
    const updated = { ...branding, ...newBranding };
    setBranding(updated);
    localStorage.setItem('app_branding', JSON.stringify(updated));
  };

  return { branding, updateBranding };
}
