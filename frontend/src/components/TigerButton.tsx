import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { Zap, Loader2 } from 'lucide-react';

interface TigerButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

export function TigerButton({
  children,
  onClick,
  disabled = false,
  isLoading = false,
  size = 'md',
  variant = 'primary',
  icon = <Zap size={18} />,
}: TigerButtonProps) {
  const { isDark } = useTheme();
  const tigerOrange = '#F2541B';

  const sizeStyles = {
    sm: { padding: '10px 20px', fontSize: '13px' },
    md: { padding: '16px 32px', fontSize: '16px' },
    lg: { padding: '20px 40px', fontSize: '18px' },
  };

  const baseStyles = {
    position: 'relative' as const,
    borderRadius: '16px',
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    overflow: 'hidden',
    ...sizeStyles[size],
  };

  const variantStyles = {
    primary: {
      background: tigerOrange,
      color: 'white',
      boxShadow: '0 4px 14px rgba(242, 84, 27, 0.35)',
    },
    secondary: {
      background: isDark ? 'rgba(255,255,255,0.1)' : 'white',
      color: isDark ? 'white' : '#1F2937',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
    },
  };

  // Pulse animation for primary variant
  const pulseAnimation = variant === 'primary' && !disabled && !isLoading
    ? {
        boxShadow: [
          '0 0 0px rgba(242, 84, 27, 0)',
          '0 0 20px rgba(242, 84, 27, 0.6)',
          '0 0 0px rgba(242, 84, 27, 0)',
        ],
      }
    : {};

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        opacity: disabled ? 0.6 : 1,
      }}
      animate={pulseAnimation}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileHover={!disabled && !isLoading ? {
        scale: 1.05,
        boxShadow: variant === 'primary' 
          ? '0 6px 30px rgba(242, 84, 27, 0.5)'
          : '0 4px 20px rgba(0,0,0,0.1)',
      } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
    >
      {/* Background glow on hover */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.2), transparent)',
          opacity: 0,
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon with slide animation */}
      <motion.span
        style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}
        animate={isLoading ? { rotate: 360 } : {}}
        transition={isLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
      >
        {isLoading ? <Loader2 size={18} /> : icon}
      </motion.span>

      {/* Text */}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>

      {/* Shine sweep effect */}
      {!disabled && !isLoading && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          }}
          animate={{
            left: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.button>
  );
}
