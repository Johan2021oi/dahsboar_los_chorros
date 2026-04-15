import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
  subtitle: 'TU NEGOCIO INTELIGENTE',
  logoImage: '/logo-square.png',
};

interface BrandingContextType {
  branding: Branding;
  updateBranding: (newBranding: Partial<Branding>) => Promise<boolean>;
  loading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const STORAGE_KEY = 'busi_branding_fallback';

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState<Branding>(() => {
    // Intentar cargar de LocalStorage como primera opción para evitar parpadeos
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_BRANDING;
  });
  const [loading, setLoading] = useState(true);

  // Cargar desde Auth Metadata
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadBrandingFromMetadata = () => {
      try {
        const metadata = user.user_metadata || {};
        
        // Cargar desde metadata con fallback al DEFAULT_BRANDING
        const loadedBranding: Branding = {
          appName: metadata.app_name || metadata.business_name || DEFAULT_BRANDING.appName,
          logoText: metadata.logo_text || DEFAULT_BRANDING.logoText,
          subtitle: metadata.subtitle || DEFAULT_BRANDING.subtitle,
          logoImage: metadata.logo_image || DEFAULT_BRANDING.logoImage,
          phone: metadata.phone,
          address: metadata.address,
          email: metadata.email,
        };
        
        setBranding(loadedBranding);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedBranding));
      } catch (err) {
        console.error('Error loading branding from metadata:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBrandingFromMetadata();
  }, [user]);

  const updateBranding = async (newBranding: Partial<Branding>): Promise<boolean> => {
    if (!user) return false;

    const updated = { ...branding, ...newBranding };
    
    // 1. Actualización inmediata en LocalStorage (Plan B)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setBranding(updated);

    // 2. Persistencia en Supabase Auth Metadata
    try {
      // Comprimir imagen si es muy grande
      let logoToSave = updated.logoImage;
      if (logoToSave && logoToSave.startsWith('data:') && logoToSave.length > 500000) {
        const img = new Image();
        const canvas = document.createElement('canvas');
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const MAX = 256;
            let w = img.width, h = img.height;
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else { w = Math.round(w * MAX / h); h = MAX; }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
            logoToSave = canvas.toDataURL('image/webp', 0.7);
            resolve();
          };
          img.src = logoToSave!;
        });
      }

      // Guardar directamente en el perfil del usuario (Auth Metadata)
      const { error } = await supabase.auth.updateUser({
        data: {
          app_name: updated.appName,
          logo_text: updated.logoText,
          subtitle: updated.subtitle,
          logo_image: logoToSave,
          phone: updated.phone,
          address: updated.address,
          email: updated.email,
          business_name: updated.appName // Mantener compatibilidad por si acaso
        }
      });

      if (error) {
        console.error('Error saving to Auth Metadata:', error);
        return false;
      }

      // Sincronizar estado final
      const finalBranding = { ...updated, logoImage: logoToSave };
      setBranding(finalBranding);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalBranding));
      return true;

    } catch (err) {
      console.error('Critical error in updateBranding:', err);
      return false;
    }
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBrandingContext() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBrandingContext must be used within a BrandingProvider');
  }
  return context;
}
