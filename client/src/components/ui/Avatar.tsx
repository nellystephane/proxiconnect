interface AvatarProps {
  photo?: string;
  prenom?: string;
  nom?: string;
  size?: 'sm' | 'md' | 'lg';
  ring?: boolean;
}

const SIZE_CLASSES = { sm: 'w-8 h-8 text-[10px]', md: 'w-11 h-11 text-xs', lg: 'w-14 h-14 text-sm' };

// ─── Avatar unique (photo ou initiales en secours) : remplace la fonction
// initiales() et le rendu associé dupliqués dans Conversations/Conversation. ───
const Avatar = ({ photo, prenom, nom, size = 'md', ring = true }: AvatarProps) => {
  const initiales = `${prenom?.[0] || ''}${nom?.[0] || ''}` || '?';
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden flex-shrink-0 ${SIZE_CLASSES[size]} ${ring ? 'ring-2 ring-white' : ''}`}
    >
      {photo ? (
        <img src={photo} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-[#007AFF]">{initiales}</span>
      )}
    </div>
  );
};

export default Avatar;
