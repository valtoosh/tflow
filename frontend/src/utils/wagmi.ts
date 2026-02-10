import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'TigerFlow',
  projectId: 'tigerflow-demo',
  chains: [baseSepolia],
  ssr: false,
});
