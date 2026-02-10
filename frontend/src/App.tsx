import { useRef, useEffect, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Zap, Shield, TrendingUp } from 'lucide-react';
import { SwapInterface } from './components/SwapInterface';
import { Vaults } from './components/Vaults';

// Spotlight hook for mouse tracking
function useSpotlight(ref: React.RefObject<HTMLElement>) {
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty('--mouse-x', `${x}px`);
    ref.current.style.setProperty('--mouse-y', `${y}px`);
  }, [ref]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.addEventListener('mousemove', handleMouseMove);
    return () => element.removeEventListener('mousemove', handleMouseMove);
  }, [ref, handleMouseMove]);
}

function Header() {
  const location = useLocation();
  
  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <Link to="/" className="logo">
            <img src="/tiger-logo.svg" alt="TigerFlow" />
            <span className="logo-text">TigerFlow</span>
          </Link>
          
          <nav className="nav">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Swap
            </Link>
            <Link 
              to="/vaults" 
              className={`nav-link ${location.pathname === '/vaults' ? 'active' : ''}`}
            >
              Vaults
            </Link>
            <a 
              href="#" 
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                alert('Docs coming soon!');
              }}
            >
              Docs
            </a>
          </nav>
          
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  useSpotlight(cardRef);

  return (
    <div ref={cardRef} className="feature-card">
      <div className="feature-icon">
        <Icon size={20} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  return (
    <main>
      <div className="container">
        <div className="hero">
          <h1>Swap with TigerFlow</h1>
          <p>Large trade execution on Base with minimal slippage</p>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="stat-value">0.01 WETH</div>
            <div className="stat-label">Total Liquidity</div>
          </div>
          <div className="stat">
            <div className="stat-value">0.10-0.15%</div>
            <div className="stat-label">Vault Fees</div>
          </div>
          <div className="stat">
            <div className="stat-value">3</div>
            <div className="stat-label">Active Vaults</div>
          </div>
        </div>

        <SwapInterface />

        <div className="features">
          <FeatureCard 
            icon={Zap}
            title="Smart Routing"
            description="Optimal split between merchant liquidity and DEX"
          />
          <FeatureCard 
            icon={Shield}
            title="Minimal Slippage"
            description="Up to 50% less slippage on large trades"
          />
          <FeatureCard 
            icon={TrendingUp}
            title="Earn Fees"
            description="Deposit WETH to earn swap fees"
          />
        </div>
      </div>
    </main>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          Built on <a href="https://base.org" target="_blank" rel="noopener noreferrer">Base</a> • 
          Contracts verified on <a href="https://sepolia.basescan.org" target="_blank" rel="noopener noreferrer">BaseScan</a>
        </p>
      </div>
    </footer>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen" style={{ background: '#0b0e11', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vaults" element={<Vaults />} />
        </Routes>
      </div>
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
