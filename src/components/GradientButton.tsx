import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface GradientButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'accent' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variants = {
  primary: 'from-sky-500 to-blue-600',
  accent: 'from-pink-500 to-rose-600',
  success: 'from-emerald-500 to-teal-600',
  warning: 'from-amber-500 to-orange-600',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export function GradientButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
}: GradientButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      className={`
        bg-gradient-to-r ${variants[variant]} text-white font-semibold rounded-lg
        shadow-lg hover:shadow-xl transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
