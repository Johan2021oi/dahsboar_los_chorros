import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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

export function useBranding() {
  const { user } = useAuth();
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBranding = async () => {
      const { data, error } = await supabase
        .from('branding')
        .select('*')
        .single() as any;

      if (data && !error) {
        setBranding({
          appName: data.app_name,
          logoText: data.logo_text,
          subtitle: data.subtitle,
          logoImage: data.logo_image,
          phone: data.phone,
          address: data.address,
          email: data.email,
        });
      } else if (error && error.code === 'PGRST116') {
        // Si no existe, usamos los valores del registro (user_metadata) si están disponibles
        const businessName = user.user_metadata?.business_name;
        if (businessName) {
          setBranding(prev => ({ ...prev, appName: businessName }));
        }
      }
      setLoading(false);
    };

    fetchBranding();
  }, [user]);

  const updateBranding = async (newBranding: Partial<Branding>) => {
    if (!user) return;

    const updated = { ...branding, ...newBranding };
    
    // Comprimir imagen si es base64 y es muy grande (>500KB)
    let logoToSave = updated.logoImage;
    if (logoToSave && logoToSave.startsWith('data:') && logoToSave.length > 500000) {
      try {
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
      } catch (e) {
        console.error('Error comprimiendo logo:', e);
      }
    }

    // Guardar en Supabase con onConflict para que funcione el upsert
    const { error } = await supabase
      .from('branding')
      .upsert({
        user_id: user.id,
        app_name: updated.appName,
        logo_text: updated.logoText,
        subtitle: updated.subtitle,
        logo_image: logoToSave,
        phone: updated.phone,
        address: updated.address,
        email: updated.email,
      } as any, { onConflict: 'user_id' });

    if (!error) {
      setBranding({ ...updated, logoImage: logoToSave });
    } else {
      console.error('Error guardando branding:', error);
    }
  };

  return { branding, updateBranding, loading };
}
