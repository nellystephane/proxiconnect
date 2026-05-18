// import { Link } from 'react-router-dom';

// const Header = () => {
//   return (
//     <header
//       className="bg-white sticky top-0 z-50 border-b border-gray-100"
//       style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)' }}
//     >
//       <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
//         {/* Logo */}
//         <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl no-underline">
//           📍 ProxiConnect
//         </Link>

//         {/* Navigation desktop */}
//         <nav className="hidden md:flex items-center gap-6">
//           <Link to="/" className="text-gray-600 hover:text-blue-600 text-sm font-medium no-underline">
//             Accueil
//           </Link>
//           <Link to="/deposer" className="text-gray-600 hover:text-blue-600 text-sm font-medium no-underline">
//             Déposer une annonce
//           </Link>
//           <Link to="/connexion" className="text-gray-600 hover:text-blue-600 text-sm font-medium no-underline">
//             Connexion
//           </Link>
//           <Link
//             to="/inscription"
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 no-underline"
//           >
//             Inscription
//           </Link>
//         </nav>

//         {/* Menu mobile */}
//         <button className="md:hidden text-gray-600 text-xl">
//           ☰
//         </button>
//       </div>
//     </header>
//   );
// };

// export default Header;

const Header = () => {
  return (
    <header
      className="bg-white sticky top-0 z-50 border-b border-gray-100"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)' }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        <a href="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl no-underline">
          📍 ProxiConnect
        </a>

        <nav className="hidden md:flex items-center gap-6">
          <a href="/" className="text-gray-600 hover:text-blue-600 text-sm font-medium no-underline">Accueil</a>
          <a href="/deposer" className="text-gray-600 hover:text-blue-600 text-sm font-medium no-underline">Déposer</a>
          <a href="/connexion" className="text-gray-600 hover:text-blue-600 text-sm font-medium no-underline">Connexion</a>
          <a href="/inscription" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 no-underline">Inscription</a>
        </nav>

        <button className="md:hidden text-gray-600 text-xl">☰</button>
      </div>
    </header>
  );
};

export default Header;