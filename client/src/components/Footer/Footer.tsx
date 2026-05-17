import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer
      className="bg-gray-800 text-gray-300 mt-auto"
      style={{ boxShadow: '0 -1px 3px rgba(0,0,0,0.04), 0 -2px 8px rgba(0,0,0,0.03)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Colonne 1 : À propos */}
          <div>
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              📍 ProxiConnect
            </h3>
            <p className="text-sm leading-relaxed">
              La plateforme qui connecte les talents locaux aux clients à proximité.
              Trouvez des services de qualité près de chez vous.
            </p>
          </div>

          {/* Colonne 2 : Liens rapides */}
          <div>
            <h4 className="text-white font-semibold mb-3">Liens rapides</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white no-underline">Accueil</Link></li>
              <li><Link to="/annonces" className="hover:text-white no-underline">Annonces</Link></li>
              <li><Link to="/deposer" className="hover:text-white no-underline">Déposer une annonce</Link></li>
              <li><Link to="/abonnements" className="hover:text-white no-underline">Abonnements</Link></li>
            </ul>
          </div>

          {/* Colonne 3 : Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span>✉️</span> contact@proxiconnect.com
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span> +229 00 00 00 00
              </li>
              <li className="flex items-center gap-2">
                <span>💬</span> WhatsApp
              </li>
            </ul>
          </div>
        </div>

        {/* Barre du bas */}
        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} ProxiConnect. Tous droits réservés.</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <Link to="/confidentialite" className="hover:text-white no-underline">Confidentialité</Link>
            <Link to="/conditions" className="hover:text-white no-underline">Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;