import { Outlet } from 'react-router-dom';
import Header from '../Header/Header.tsx';
import Footer from '../Footer/Footer.tsx';

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <Header />
      <main className="pt-20 px-4 max-w-2xl mx-auto pb-24">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
