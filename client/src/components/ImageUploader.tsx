import { useState, useRef } from 'react';
import { Image as ImageIcon, UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  currentImage?: string;
  onUpload: (url: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://proxiconnect.onrender.com/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');
      onUpload('https://proxiconnect.onrender.com' + data.url);
    }  catch (err: any) {
        console.error('Upload error:', err);
        let message = 'Erreur inconnue';
        if (err.message) message = err.message;
        if (err.response) {
          message = `Erreur ${err.response.status}: ${err.response.data?.message || 'inconnue'}`;
        }
        alert(`Erreur lors de l'upload : ${message}`);
      }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative">
        {currentImage ? (
          <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-5 h-5 text-slate-300" />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={triggerFileInput}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
      >
        <UploadCloud className="w-4 h-4" />
        {currentImage ? 'Changer' : 'Ajouter une photo'}
      </button>

      {currentImage && (
        <button
          type="button"
          onClick={() => onUpload('')}
          className="text-xs text-red-500 hover:underline"
        >
          Retirer
        </button>
      )}
    </div>
  );
};

export default ImageUploader;