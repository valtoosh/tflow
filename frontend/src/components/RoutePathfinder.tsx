import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

interface RoutePathfinderProps {
  fromToken: { symbol: string; color: string };
  toToken: { symbol: string; color: string };
  nodes?: number;
}

export function RoutePathfinder({ 
  fromToken = { symbol: 'U', color: '#3B82F6' },
  toToken = { symbol: 'W', color: '#8B5CF6' },
  nodes = 3 
}: RoutePathfinderProps) {
  const { isDark } = useTheme();
  const tigerOrange = '#F2541B';

  // Generate node positions
  const nodePositions = Array.from({ length: nodes }, (_, i) => ({
    x: 20 + ((i + 1) * 60) / (nodes + 1),
    y: 50 + (i % 2 === 0 ? -10 : 10),
  }));

  // Create curved path
  const createPath = () => {
    let path = `M 10 50`;
    
    // Curve through nodes
    nodePositions.forEach((node, i) => {
      const prevX = i === 0 ? 10 : nodePositions[i - 1].x;
      const prevY = i === 0 ? 50 : nodePositions[i - 1].y;
      const cpX = (prevX + node.x) / 2;
      path += ` Q ${cpX} ${prevY}, ${node.x} ${node.y}`;
    });
    
    // Final curve to end
    const lastNode = nodePositions[nodePositions.length - 1];
    const endCpX = (lastNode.x + 90) / 2;
    path += ` Q ${endCpX} ${lastNode.y}, 90 50`;
    
    return path;
  };

  const pathD = createPath();

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '60px',
        padding: '0 8px',
      }}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="pathGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Stronger glow for particles */}
          <filter id="particleGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Gradient for animated path */}
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={tigerOrange} stopOpacity="0" />
            <stop offset="50%" stopColor={tigerOrange} stopOpacity="1" />
            <stop offset="100%" stopColor={tigerOrange} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Background dashed path */}
        <path
          d={pathD}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="1"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />

        {/* Animated glowing path */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#pathGlow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* Node points */}
        {nodePositions.map((node, i) => (
          <g key={i}>
            {/* Node glow */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="4"
              fill={tigerOrange}
              opacity="0.3"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
            {/* Node core */}
            <circle
              cx={node.x}
              cy={node.y}
              r="2"
              fill={tigerOrange}
            />
          </g>
        ))}

        {/* From token */}
        <g>
          <circle cx="10" cy="50" r="6" fill={fromToken.color} />
          <text 
            x="10" 
            y="54" 
            textAnchor="middle" 
            fill="white" 
            fontSize="6" 
            fontWeight="800"
          >
            {fromToken.symbol}
          </text>
        </g>

        {/* To token */}
        <g>
          <circle cx="90" cy="50" r="6" fill={toToken.color} />
          <text 
            x="90" 
            y="54" 
            textAnchor="middle" 
            fill="white" 
            fontSize="6" 
            fontWeight="800"
          >
            {toToken.symbol}
          </text>
        </g>

        {/* Traveling particles */}
        <motion.circle
          r="3"
          fill={tigerOrange}
          filter="url(#particleGlow)"
          style={{
            offsetPath: `path('${pathD}')`,
          }}
          animate={{
            offsetDistance: ['0%', '100%'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Secondary particle (delayed) */}
        <motion.circle
          r="2"
          fill={tigerOrange}
          opacity="0.6"
          filter="url(#particleGlow)"
          style={{
            offsetPath: `path('${pathD}')`,
          }}
          animate={{
            offsetDistance: ['0%', '100%'],
            opacity: [0, 0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
            delay: 1.5,
          }}
        />
      </svg>
    </div>
  );
}
