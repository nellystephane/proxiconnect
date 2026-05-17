import Header from './components/Header/Header.tsx';
import Footer from './components/Footer/Footer.tsx';
// import { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold text-blue-600 text-center pt-10">
          ProxiConnect 🚀
        </h1>
        <p className="text-center text-gray-500 mt-2">
          Header et Footer sont en place !
        </p>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;