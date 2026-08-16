import { useState, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { API_BASE_URL } from '../api/axios.ts';

// Props strictement identiques à la version précédente : le composant est
// partagé par Deposer, MaBoutique, MonRestaurant, MonHotel, Profil...
interface ImageUploaderProps {
  currentImage?: string;
  onUpload: (url: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // ── Logique de téléversement conservée à l'identique ──
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');
      onUpload(`${API_BASE_URL}${data.url}`);
    } catch (err: any) {
      console.error('Upload error:', err);
      let message = 'Erreur inconnue';
      if (err.message) message = err.message;
      if (err.response) {
        message = `Erreur ${err.response.status}: ${err.response.data?.message || 'inconnue'}`;
      }
      alert(`Erreur lors de l'upload : ${message}`);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    // Le conteneur remplit la cellule parente (grilles de vignettes en
    // aspect-square) tout en gardant une hauteur raisonnable en ligne.
    <div className="relative w-full h-full">
      {/* Zone de dépôt "glass dashed" : un clic parcourt les fichiers
          (aucun drag&drop n'existait auparavant — même déclencheur conservé) */}
      <button
        type="button"
        onClick={triggerFileInput}
        aria-label={currentImage ? 'Changer la photo' : 'Ajouter une photo'}
        className={`group relative w-full h-full min-h-[104px] rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2 px-3 py-4 text-center transition-all duration-200 ${
          currentImage
            ? 'border border-transparent'
            : 'border-2 border-dashed border-slate-300/80 glass-light hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]'
        }`}
      >
        {currentImage ? (
          <>
            {/* Vignette plein cadre */}
            <img
              src={currentImage}
              alt="Aperçu de la photo"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Voile + pilule "Changer" révélés au survol */}
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="glass-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-900">
                <ImagePlus className="w-4 h-4" /> Changer
              </span>
            </span>
          </>
        ) : (
          <>
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
              <ImagePlus className="w-5 h-5" />
            </span>
            <span className="text-sm font-semibold text-slate-700 leading-tight">Ajouter une photo</span>
            <span className="text-[11px] text-slate-400 leading-tight">JPG ou PNG — cliquez pour parcourir</span>
          </>
        )}
      </button>

      {/* Progression du téléversement (voile + barre indéterminée) */}
      {uploading && (
        <div className="glass-solid absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-2.5 animate-fade-in">
          <div className="h-6 w-6 border-2 border-primary/25 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Envoi en cours…</p>
          <div className="w-2/3 h-1 rounded-full bg-primary/15 overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      )}

      {/* Suppression de la photo (glass-control) — en bas à droite pour ne pas
          entrer en collision avec les boutons de slot des grilles parentes */}
      {currentImage && !uploading && (
        <button
          type="button"
          onClick={() => onUpload('')}
          aria-label="Retirer la photo"
          title="Retirer la photo"
          className="glass-control absolute bottom-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUploader;
