import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: any) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/webp', 0.8);
  };

  const handleConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-slate-900">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900 shrink-0">
        <h3 className="text-white font-bold">Ajustar Logo</h3>
        <button onClick={onCancel} className="p-2 text-white/60 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 relative bg-black/20">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onComplete}
          cropShape="round"
          showGrid={true}
        />
      </div>

      <div className="p-8 bg-slate-900 space-y-6 shrink-0 border-t border-white/10">
        <div className="flex items-center gap-4 text-white/60">
          <ZoomOut size={18} />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-farm h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <ZoomIn size={18} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-4 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-4 bg-farm text-white rounded-2xl font-black text-sm shadow-xl shadow-farm/20 hover:shadow-farm/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check size={20} /> Confirmar Ajuste
          </button>
        </div>
      </div>
    </div>
  );
}
