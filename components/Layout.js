import { useState } from 'react';
import SideNav from '@/components/Navigation/SideNav';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen w-full mx-auto">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 max-w-72 glass transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}>
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/80 to-slate-900/80">
          <h2 className="text-xl font-bold text-white text-shadow">WELCOME</h2>
          <button
            className="lg:hidden text-white hover:text-purple-200 transition-colors"
            onClick={toggleSidebar}
          >
            ✖
          </button>
        </div>
        <SideNav />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-gradient-to-r from-purple-900/80 to-slate-900/80 p-4 sticky top-0 z-20 lg:hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white text-shadow">CARD PRICE APP</h3>
            <button 
              className="text-white hover:text-purple-200 transition-colors text-2xl"
              onClick={toggleSidebar}
            >
              ☰
            </button>
          </div>
        </header>
        <main className="w-full max-w-fit mx-auto">
          <div className="m-3 p-3 mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}