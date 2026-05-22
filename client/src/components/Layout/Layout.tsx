// import React from 'react';
// import Header from '../Header/Header.tsx';
// import Footer from '../Footer/Footer.tsx';

// interface LayoutProps {
//   children: React.ReactNode;
//   showFooter?: boolean;
//   isConnected?: boolean;
//   userName?: string;
// }

// const Layout: React.FC<LayoutProps> = ({
//   children,
//   showFooter = true,
//   isConnected = false,
//   userName,
// }) => {
//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header isConnected={isConnected} userName={userName} />
//       <main className="pb-20">{children}</main>
//       {showFooter && <Footer />}
//     </div>
//   );
// };

// export default Layout;
import Header from '../Header/Header.tsx';
import Footer from '../Footer/Footer.tsx';

const Layout = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20 px-4 max-w-2xl mx-auto pb-24">
        {/* Le contenu sera injecté ici via Outlet si utilisé avec react-router */}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;