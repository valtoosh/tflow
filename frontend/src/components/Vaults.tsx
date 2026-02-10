import { useState } from 'react';
import { TrendingUp, Wallet, ExternalLink } from 'lucide-react';

interface Vault {
  name: string;
  fee: string;
  liquidity: string;
  address: string;
}

const vaults: Vault[] = [
  { name: 'Alpha Vault', fee: '0.12%', liquidity: '0.0033 WETH', address: '0x...A1B2' },
  { name: 'Beta Vault', fee: '0.15%', liquidity: '0.0033 WETH', address: '0x...C3D4' },
  { name: 'Gamma Vault', fee: '0.10%', liquidity: '0.0034 WETH', address: '0x...E5F6' },
];

export function Vaults() {
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedVault, setSelectedVault] = useState<string | null>(null);

  return (
    <main>
      <div className="container">
        <div className="hero">
          <h1>Liquidity Vaults</h1>
          <p>Deposit WETH to earn swap fees from TigerFlow traders</p>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="stat-value">0.01 WETH</div>
            <div className="stat-label">Total Liquidity</div>
          </div>
          <div className="stat">
            <div className="stat-value">0.12%</div>
            <div className="stat-label">Avg Fee</div>
          </div>
          <div className="stat">
            <div className="stat-value">3</div>
            <div className="stat-label">Vaults</div>
          </div>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} style={{ color: '#ff6b35' }} />
              Active Vaults
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vaults.map((vault) => (
                <div 
                  key={vault.name}
                  className="route-option"
                  style={{ 
                    cursor: 'pointer',
                    borderColor: selectedVault === vault.name ? '#ff6b35' : undefined,
                    background: selectedVault === vault.name ? 'rgba(255, 107, 53, 0.1)' : undefined,
                  }}
                  onClick={() => setSelectedVault(selectedVault === vault.name ? null : vault.name)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px', 
                        background: 'rgba(255, 107, 53, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Wallet size={18} style={{ color: '#ff6b35' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{vault.name}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>{vault.address}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 500 }}>{vault.liquidity}</div>
                      <div style={{ fontSize: '13px', color: '#10b981' }}>{vault.fee} fee</div>
                    </div>
                  </div>

                  {selectedVault === vault.name && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #2a333c' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                          type="number"
                          placeholder="WETH amount"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #2a333c',
                            background: '#11141a',
                            color: '#fff',
                            fontSize: '16px',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                          className="btn-primary"
                          style={{ width: 'auto', padding: '12px 24px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Deposit coming soon!');
                          }}
                        >
                          Deposit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: '#11141a', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>How it works</h3>
              <ol style={{ fontSize: '14px', color: '#9ca3af', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Deposit WETH into a vault</li>
                <li>Earn fees from every swap that uses your liquidity</li>
                <li>Withdraw anytime with your earned fees</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">
              <TrendingUp size={20} />
            </div>
            <h3>Passive Income</h3>
            <p>Earn fees from every swap automatically</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Wallet size={20} />
            </div>
            <h3>No Lock-up</h3>
            <p>Withdraw your liquidity anytime</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <ExternalLink size={20} />
            </div>
            <h3>Transparent</h3>
            <p>All vaults are verified on BaseScan</p>
          </div>
        </div>
      </div>
    </main>
  );
}
