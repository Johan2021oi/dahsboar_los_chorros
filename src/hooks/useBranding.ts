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
  subtitle: 'GESTIÓN DE NEGOCIOS',
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
        .single();

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
    
    // Guardar en Supabase
    const { error } = await supabase
      .from('branding')
      .upsert({
        user_id: user.id,
        app_name: updated.appName,
        logo_text: updated.logoText,
        subtitle: updated.subtitle,
        logo_image: updated.logoImage,
        phone: updated.phone,
        address: updated.address,
        email: updated.email,
      });

    if (!error) {
      setBranding(updated);
    }
  };

  return { branding, updateBranding, loading };
}
