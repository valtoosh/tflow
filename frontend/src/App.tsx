import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { SwapInterface } from './components/SwapInterface';
import { Vaults } from './components/Vaults';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTheme } from './hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

function Header() {
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();
  
  return (
    <nav 
      className="sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300"
      style={{
        backgroundColor: isDark ? 'rgba(44, 33, 23, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        borderColor: isDark ? '#3d2e20' : '#e5e7eb'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="relative w-8 h-8">
              <img src="/tiger-logo.svg" alt="TigerFlow" className="w-full h-full object-contain rounded-full" />
            </div>
            <span 
              className="font-display font-bold text-xl tracking-tight"
              style={{ color: isDark ? '#ffffff' : '#111827' }}
            >
              TigerFlow
            </span>
          </Link>
          
          {/* Nav - Absolute Centered */}
          <div className="hidden md:flex items-center space-x-1 p-1 rounded-xl border absolute left-1/2 transform -translate-x-1/2"
            style={{
              backgroundColor: isDark ? '#3d2e20' : '#f3f4f6',
              borderColor: isDark ? '#3d2e20' : '#e5e7eb'
            }}
          >
            <Link 
              to="/" 
              className="px-5 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: location.pathname === '/' ? (isDark ? '#2c2117' : '#ffffff') : 'transparent',
                color: location.pathname === '/' ? '#F2541B' : (isDark ? '#9ca3af' : '#6b7280'),
                boxShadow: location.pathname === '/' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Swap
            </Link>
            <Link 
              to="/vaults" 
              className="px-5 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: location.pathname === '/vaults' ? (isDark ? '#2c2117' : '#ffffff') : 'transparent',
                color: location.pathname === '/vaults' ? '#F2541B' : (isDark ? '#9ca3af' : '#6b7280'),
                boxShadow: location.pathname === '/vaults' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Vaults
            </Link>
          </div>
          
          {/* Right Side */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Network Badge */}
            <button 
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors border"
              style={{
                backgroundColor: isDark ? '#3d2e20' : '#f3f4f6',
                borderColor: isDark ? '#3d2e20' : '#e5e7eb'
              }}
            >
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">B</div>
              <span 
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: isDark ? '#d1d5db' : '#374151' }}
              >
                Base
              </span>
            </button>
            
            <ConnectButton />
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#3d2e20' : '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Home() {
  const { isDark } = useTheme();
  
  return (
    <main className="flex-grow flex flex-col items-center justify-center p-4 relative w-full">
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full orb" />
        <div className="absolute bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 rounded-full orb" />
      </div>
      
      <div className="relative z-10 text-center w-full flex flex-col items-center">
        {/* Title */}
        <div className="mb-10">
          <h1 
            className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight"
            style={{ color: isDark ? '#ffffff' : '#111827' }}
          >
            {isDark ? (
              <><span style={{ color: '#9ca3af' }}>Immersive</span> <span className="text-primary">Flow</span></>
            ) : (
              <>Express <span className="text-primary">Swap</span></>
            )}
          </h1>
          <p 
            className="text-lg font-medium max-w-md mx-auto"
            style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
          >
            {isDark 
              ? 'Harness the power of a multi-dimensional liquidity network for supreme execution speed.'
              : 'Fastest route, zero complexity.'
            }
          </p>
        </div>
        
        <SwapInterface />
        
        {/* Stats */}
        <div className="mt-10 flex justify-center space-x-10 text-center">
          <div>
            <p 
              className="text-[10px] uppercase font-bold tracking-widest mb-1"
              style={{ color: '#6b7280' }}
            >
              {isDark ? 'Total Flow' : 'Volume (24h)'}
            </p>
            <p 
              className="text-lg font-display font-bold"
              style={{ color: isDark ? '#ffffff' : '#111827' }}
            >
              $42.8M
            </p>
          </div>
          <div>
            <p 
              className="text-[10px] uppercase font-bold tracking-widest mb-1"
              style={{ color: '#6b7280' }}
            >
              {isDark ? 'Latency' : 'Avg Speed'}
            </p>
            <p className="text-lg font-display font-bold text-primary">
              {isDark ? '24ms' : '~2.4s'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function Footer() {
  const { isDark } = useTheme();
  
  return (
    <footer 
      className="mt-auto border-t py-8 relative z-10 transition-colors duration-300"
      style={{
        backgroundColor: isDark ? '#2c2117' : '#ffffff',
        borderColor: isDark ? '#3d2e20' : '#e5e7eb'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm">
        <div 
          className="flex items-center space-x-4 mb-4 md:mb-0"
          style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
        >
          <span 
            className="font-bold"
            style={{ color: isDark ? '#ffffff' : '#111827' }}
          >
            TigerFlow
          </span>
          <span className="opacity-60">© 2024</span>
          {isDark && (
            <span className="text-[11px] tracking-widest opacity-60">V1.2.4-STABLE</span>
          )}
        </div>
        <div 
          className="flex space-x-8 font-medium"
          style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
        >
          {isDark ? (
            <>
              <a href="#" className="hover:text-primary transition-colors">Network Status</a>
              <a href="#" className="hover:text-primary transition-colors">Security</a>
              <a href="#" className="hover:text-primary transition-colors">Interface</a>
              <a href="#" className="hover:text-primary transition-colors">Satellite</a>
            </>
          ) : (
            <>
              <a href="#" className="hover:text-primary transition-colors">Security</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
              <a href="#" className="hover:text-primary transition-colors">Twitter</a>
              <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  
  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{
        backgroundColor: isDark ? '#221910' : '#F8F9FA',
        color: isDark ? '#F3F4F6' : '#1F2937'
      }}
    >
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vaults" element={<Vaults />} />
      </Routes>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
