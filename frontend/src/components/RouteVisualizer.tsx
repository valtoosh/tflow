import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

interface RouteVisualizerProps {
  isAnimating?: boolean;
  vaultCount?: number;
}

export function RouteVisualizer({ isAnimating = true, vaultCount = 3 }: RouteVisualizerProps) {
  const { isDark } = useTheme();
  
  // Tiger Orange color
  const tigerOrange = '#F2541B';
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

  // Generate vault nodes positions
  const nodes = Array.from({ length: vaultCount }, (_, i) => ({
    x: 150 + (i * 80),
    y: 50 + (i % 2 === 0 ? -15 : 15),
    delay: i * 0.3
  }));

  // Create curved path through nodes
  const createPath = () => {
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

  return (
    <div 
      className={`relative w-full h-[100px] mt-5 p-4 rounded-2xl backdrop-blur-md border ${
        isDark 
          ? 'bg-white/[0.03] border-white/10' 
          : 'bg-gray-50/80 border-gray-200/80'
      }`}
    >
      {/* Label - Fixed position */}
      <div className="absolute top-3 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/40 z-10 pointer-events-none">
        Route Optimization Network
      </div>

      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 500 100"
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Stronger glow for particles */}
          <filter id="particleGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Gradient for path */}
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={tigerOrange} stopOpacity="0.2" />
            <stop offset="50%" stopColor={tigerOrange} stopOpacity="1" />
            <stop offset="100%" stopColor={tigerOrange} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Background grid dots */}
        {Array.from({ length: 20 }).map((_, i) => (
          <circle
            key={`grid-${i}`}
            cx={30 + i * 23}
            cy={50}
            r="1"
            className={isDark ? 'fill-white/10' : 'fill-black/10'}
          />
        ))}

        {/* Static background path (dashed) */}
        <motion.path
          d={mainPath}
          fill="none"
          className={isDark ? 'stroke-white/10' : 'stroke-black/10'}
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
            style={{
              filter: `drop-shadow(0 0 8px ${glowColor})`,
            }}
          />
        )}

        {/* Vault nodes */}
        {nodes.map((node, i) => (
          <g key={`node-${i}`}>
            {/* Node glow ring */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="12"
              fill="none"
              stroke={tigerOrange}
              strokeWidth="1"
              opacity="0.3"
              variants={nodePulse}
              animate="animate"
              style={{ transformOrigin: 'center' }}
            />
            
            {/* Node core */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="6"
              fill={tigerOrange}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.2, duration: 0.3 }}
            />
            
            {/* Node label */}
            <text
              x={node.x}
              y={node.y + 20}
              textAnchor="middle"
              className={isDark ? 'fill-white/60' : 'fill-gray-500'}
              fontSize="8"
              fontWeight="700"
            >
              V{i + 1}
            </text>
          </g>
        ))}

        {/* Start point (USDC) */}
        <g>
          <circle cx="40" cy="50" r="10" fill="#3B82F6" />
          <text x="40" y="54" textAnchor="middle" fill="white" fontSize="8" fontWeight="800">U</text>
        </g>

        {/* End point (WETH) */}
        <g>
          <circle cx="460" cy="50" r="10" fill="#8B5CF6" />
          <text x="460" y="54" textAnchor="middle" fill="white" fontSize="8" fontWeight="800">W</text>
        </g>

        {/* Traveling pulse particles */}
        {isAnimating && (
          <>
            <motion.circle
              r="5"
              fill={tigerOrange}
              filter="url(#particleGlow)"
              style={{
                offsetPath: `path('${mainPath}')`,
              }}
              variants={pulseVariants}
              animate="animate"
            />
            <motion.circle
              r="3"
              fill="white"
              style={{
                offsetPath: `path('${mainPath}')`,
              }}
              variants={pulseVariants}
              animate="animate"
            />
            {/* Secondary pulse */}
            <motion.circle
              r="4"
              fill={tigerOrange}
              opacity="0.6"
              filter="url(#particleGlow)"
              style={{
                offsetPath: `path('${mainPath}')`,
              }}
              variants={pulseVariants2}
              animate="animate"
            />
          </>
        )}

        {/* Data flow lines (vertical) */}
        {isAnimating && nodes.map((node, i) => (
          <motion.line
            key={`flow-${i}`}
            x1={node.x}
            y1={node.y - 20}
            x2={node.x}
            y2={node.y - 30}
            stroke={tigerOrange}
            strokeWidth="1"
            opacity="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
          />
        ))}
      </svg>

      {/* Stats overlay */}
      <div className="absolute bottom-2 left-4 flex items-center gap-2 text-[11px] font-bold text-gray-400 dark:text-white/50">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        {vaultCount} Active Nodes
      </div>

      <div className="absolute bottom-2 right-4 text-[11px] font-bold text-primary">
        +{(vaultCount * 0.8).toFixed(1)}% Optimized
      </div>
    </div>
  );
}

// Simplified version for inline display
export function MiniRouteVisualizer() {
  const { isDark } = useTheme();
  const tigerOrange = '#F2541B';
  
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-extrabold">U</div>
      
      <div className={`flex-1 h-0.5 relative rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
        <motion.div
          className="absolute -top-[1.5px] left-0 right-0 h-1 rounded"
          style={{
            background: `linear-gradient(90deg, transparent, ${tigerOrange}, transparent)`,
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 text-[9px] font-extrabold tracking-wider whitespace-nowrap ${
          isDark ? 'bg-surface-dark text-primary' : 'bg-white text-primary'
        }`}>
          Aggregated
        </span>
      </div>
      
      <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px] font-extrabold">W</div>
    </div>
  );
}
