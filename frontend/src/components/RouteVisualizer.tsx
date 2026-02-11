import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { TrendingUp } from 'lucide-react';

interface RouteSource {
  type: 'robinpump' | 'vault' | 'uniswap';
  percentage: number;
  name: string;
}

interface RouteVisualizerProps {
  isAnimating?: boolean;
  sources?: RouteSource[];
}

export function RouteVisualizer({ isAnimating = true, sources }: RouteVisualizerProps) {
  const { isDark } = useTheme();
  
  const tigerOrange = '#F2541B';
  const robinPumpColor = '#10B981'; // Green for RobinPump
  const uniswapColor = '#3B82F6';   // Blue for Uniswap
  const vaultColor = tigerOrange;    // Orange for vaults
  
  const glowColor = isDark ? 'rgba(242, 84, 27, 0.8)' : 'rgba(242, 84, 27, 0.6)';
  
  // Path animation variants
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 1.5, ease: "easeInOut" as const },
        opacity: { duration: 0.5 }
      }
    }
  };

  // Pulse particle animation
  const pulseVariants = {
    animate: {
      offsetDistance: ["0%", "100%"],
      opacity: [0, 1, 1, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "linear" as const,
      }
    }
  };

  // Secondary pulse (delayed)
  const pulseVariants2 = {
    animate: {
      offsetDistance: ["0%", "100%"],
      opacity: [0, 0, 1, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "linear" as const,
        delay: 1.25
      }
    }
  };

  // Node pulse animation
  const nodePulse = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  // Use provided sources or generate default vault nodes
  const hasRobinPump = sources?.some(s => s.type === 'robinpump');
  const hasUniswap = sources?.some(s => s.type === 'uniswap');
  const vaultSources = sources?.filter(s => s.type === 'vault') || [];
  
  // Generate node positions based on sources
  const generateNodes = () => {
    const nodes: Array<{ x: number; y: number; type: string; name: string; color: string; percentage: number }> = [];
    
    // Calculate even spacing across the full width (from USDC at 40 to WETH at 460)
    const startX = 100;
    const endX = 400;
    const totalSources = (hasRobinPump ? 1 : 0) + vaultSources.length + (hasUniswap ? 1 : 0);
    const availableWidth = endX - startX;
    const spacing = totalSources > 1 ? availableWidth / (totalSources - 1) : 0;
    let currentIndex = 0;
    
    // Add RobinPump first if present
    if (hasRobinPump) {
      const rpSource = sources?.find(s => s.type === 'robinpump');
      nodes.push({
        x: startX + (currentIndex * spacing),
        y: 35,
        type: 'robinpump',
        name: 'RP',
        color: robinPumpColor,
        percentage: rpSource?.percentage || 0
      });
      currentIndex++;
    }
    
    // Add vaults
    vaultSources.forEach((vault, i) => {
      nodes.push({
        x: startX + (currentIndex * spacing),
        y: 65 - (i % 2 === 0 ? 15 : 0),
        type: 'vault',
        name: `V${i + 1}`,
        color: vaultColor,
        percentage: vault.percentage
      });
      currentIndex++;
    });
    
    // Add Uniswap last if present
    if (hasUniswap) {
      const uniSource = sources?.find(s => s.type === 'uniswap');
      nodes.push({
        x: endX,
        y: 50,
        type: 'uniswap',
        name: 'Uni',
        color: uniswapColor,
        percentage: uniSource?.percentage || 0
      });
    }
    
    return nodes;
  };

  const nodes = generateNodes();

  // Create curved path through nodes
  const createPath = () => {
    if (nodes.length === 0) return "M 40 50 L 460 50";
    
    let path = "M 40 50";
    nodes.forEach((node, i) => {
      const prevX = i === 0 ? 40 : nodes[i - 1].x;
      const prevY = i === 0 ? 50 : nodes[i - 1].y;
      const cpX = (prevX + node.x) / 2;
      path += ` Q ${cpX} ${prevY}, ${node.x} ${node.y}`;
    });
    path += ` T 460 50`;
    return path;
  };

  const mainPath = createPath();

  // Calculate total optimization
  const totalOptimized = sources?.reduce((acc, s) => acc + (s.type !== 'uniswap' ? s.percentage : 0), 0) || 0;

  return (
    <div 
      className="relative w-full h-[120px] mt-5 p-4 rounded-2xl backdrop-blur-md border"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(249,250,251,0.8)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(229,231,235,0.8)'
      }}
    >
      {/* Label */}
      <div 
        className="absolute top-3 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-[0.15em] z-10 pointer-events-none"
        style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(107,114,128,0.6)' }}
      >
        {hasRobinPump ? 'Multi-Source Route: RobinPump + Vaults + Uniswap' : 'Route Optimization Network'}
      </div>

      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 500 100"
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="particleGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={hasRobinPump ? robinPumpColor : tigerOrange} stopOpacity="0.2" />
            <stop offset="50%" stopColor={tigerOrange} stopOpacity="1" />
            <stop offset="100%" stopColor={hasUniswap ? uniswapColor : tigerOrange} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Background grid dots */}
        {Array.from({ length: 20 }).map((_, i) => (
          <circle
            key={`grid-${i}`}
            cx={30 + i * 23}
            cy={50}
            r="1"
            fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          />
        ))}

        {/* Static background path */}
        <motion.path
          d={mainPath}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="1"
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        {/* Animated glow path */}
        {isAnimating && (
          <motion.path
            d={mainPath}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#glow)"
            variants={pathVariants}
            initial="hidden"
            animate="visible"
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
          />
        )}

        {/* Source nodes */}
        {nodes.map((node, i) => (
          <g key={`node-${i}`}>
            {/* Node glow ring */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="14"
              fill="none"
              stroke={node.color}
              strokeWidth="2"
              opacity="0.3"
              variants={nodePulse}
              animate="animate"
              style={{ transformOrigin: 'center' }}
            />
            
            {/* Node core */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="8"
              fill={node.color}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.2, duration: 0.3 }}
            />
            
            {/* RobinPump icon */}
            {node.type === 'robinpump' && (
              <foreignObject x={node.x - 6} y={node.y - 6} width="12" height="12">
                <div className="w-full h-full flex items-center justify-center text-white">
                  <TrendingUp size={8} />
                </div>
              </foreignObject>
            )}
            
            {/* Node label */}
            <text
              x={node.x}
              y={node.y + 22}
              textAnchor="middle"
              fill={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(107,114,128,0.6)'}
              fontSize="8"
              fontWeight="700"
            >
              {node.name}
            </text>
            
            {/* Percentage label */}
            {node.percentage > 0 && (
              <text
                x={node.x}
                y={node.y - 18}
                textAnchor="middle"
                fill={node.color}
                fontSize="7"
                fontWeight="800"
              >
                {node.percentage.toFixed(0)}%
              </text>
            )}
          </g>
        ))}

        {/* Start point (USDC) */}
        <g>
          <circle cx="40" cy="50" r="10" fill="#3B82F6" />
          <text x="40" y="54" textAnchor="middle" fill="white" fontSize="8" fontWeight="800">U</text>
        </g>

        {/* End point (WETH) */}
        <g>
          <circle 
            cx="460" 
            cy="50" 
            r="10" 
            fill="#8B5CF6" 
          />
          <text 
            x="460" 
            y="54" 
            textAnchor="middle" 
            fill="white" 
            fontSize="8" 
            fontWeight="800"
          >
            W
          </text>
        </g>

        {/* Traveling pulse particles */}
        {isAnimating && (
          <>
            <motion.circle
              r="5"
              fill={hasRobinPump ? robinPumpColor : tigerOrange}
              filter="url(#particleGlow)"
              style={{ offsetPath: `path('${mainPath}')` }}
              variants={pulseVariants}
              animate="animate"
            />
            <motion.circle
              r="3"
              fill="white"
              style={{ offsetPath: `path('${mainPath}')` }}
              variants={pulseVariants}
              animate="animate"
            />
            <motion.circle
              r="4"
              fill={hasRobinPump ? robinPumpColor : tigerOrange}
              opacity="0.6"
              filter="url(#particleGlow)"
              style={{ offsetPath: `path('${mainPath}')` }}
              variants={pulseVariants2}
              animate="animate"
            />
          </>
        )}
      </svg>

      {/* Stats overlay */}
      <div 
        className="absolute bottom-2 left-4 flex items-center gap-2 text-[11px] font-bold"
        style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(107,114,128,0.5)' }}
      >
        <span 
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: hasRobinPump ? robinPumpColor : tigerOrange }}
        />
        {nodes.length} Sources
        {hasRobinPump && <span className="text-green-500 ml-1">+RobinPump</span>}
      </div>

      <div 
        className="absolute bottom-2 right-4 text-[11px] font-bold"
        style={{ color: tigerOrange }}
      >
        +{totalOptimized.toFixed(1)}% Optimized
      </div>
    </div>
  );
}

// Mini version for inline display
export function MiniRouteVisualizer({ sources }: { sources?: RouteSource[] }) {
  const { isDark } = useTheme();
  const hasRobinPump = sources?.some(s => s.type === 'robinpump');
  
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-extrabold">U</div>
      
      <div 
        className="flex-1 h-0.5 relative rounded"
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
      >
        <motion.div
          className="absolute -top-[1.5px] left-0 right-0 h-1 rounded"
          style={{
            background: hasRobinPump 
              ? 'linear-gradient(90deg, #10B981, #F2541B, #3B82F6)'
              : 'linear-gradient(90deg, transparent, #F2541B, transparent)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <span 
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 text-[9px] font-extrabold tracking-wider whitespace-nowrap"
          style={{ 
            backgroundColor: isDark ? '#2c2117' : '#ffffff',
            color: '#F2541B'
          }}
        >
          {hasRobinPump ? 'RobinPump + Vaults' : 'Aggregated'}
        </span>
      </div>
      
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold"
        style={{ backgroundColor: '#8B5CF6' }}
      >
        W
      </div>
    </div>
  );
}
