import React from 'react';
import { Search, Home, LayoutGrid, Sparkles, ShoppingCart, User, ArrowLeft, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGlobalState } from '../../context/useGlobalState';

interface MobileAppShellProps {
  children: React.ReactNode;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({ children }) => {
  const { cart } = useGlobalState();
  const location = useLocation();
  const navigate = useNavigate();

  const totalCartItems = cart.items.reduce((total, item) => total + item.quantity, 0);

  const getDockIconColor = (path: string) => {
    return location.pathname === path ? 'text-blue-600' : 'text-gray-400';
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      {/* Mobile Device Wrapper */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-white shadow-2xl relative pb-20 overflow-hidden flex flex-col">

        {/* Global Header (Sticky) */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            {location.pathname !== '/' && (
              <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search products, brands..."
                className="w-full bg-gray-100 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={24} />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
          {children}
        </main>

        {/* Permanent Bottom Navigation Dock */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
          <div className="flex justify-around items-center h-16">
            <button onClick={() => navigate('/')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${getDockIconColor('/')}`}>
              <Home size={22} className={location.pathname === '/' ? 'fill-blue-50' : ''} />
              <span className="text-[10px] font-medium">Home</span>
            </button>

            <button onClick={() => navigate('/catalog')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${getDockIconColor('/catalog')}`}>
              <LayoutGrid size={22} className={location.pathname === '/catalog' ? 'fill-blue-50' : ''} />
              <span className="text-[10px] font-medium">Catalog</span>
            </button>

            <button onClick={() => navigate('/ai-insights')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${getDockIconColor('/ai-insights')}`}>
              <div className="relative">
                <Sparkles size={22} className={location.pathname === '/ai-insights' ? 'fill-blue-50' : ''} />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
              </div>
              <span className="text-[10px] font-medium">Insights</span>
            </button>

            <button onClick={() => navigate('/cart')} className={`flex flex-col items-center justify-center w-full h-full gap-1 relative ${getDockIconColor('/cart')}`}>
              <div className="relative">
                <ShoppingCart size={22} className={location.pathname === '/cart' ? 'fill-blue-50' : ''} />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {totalCartItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">Cart</span>
            </button>

            <button onClick={() => navigate('/profile')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${getDockIconColor('/profile')}`}>
              <User size={22} className={location.pathname === '/profile' ? 'fill-blue-50' : ''} />
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};
