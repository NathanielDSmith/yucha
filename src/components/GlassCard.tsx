import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { fadeInUp } from '../lib/animations'

interface GlassCardProps {
  children: ReactNode
  className?: string
  delay?: number
  glow?: boolean
}

export function GlassCard({ children, className = '', delay = 0, glow = false }: GlassCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay }}
      className={`
        backdrop-blur-md bg-white/10 dark:bg-white/5
        border border-white/20 dark:border-white/10
        rounded-2xl p-6
        shadow-xl hover:shadow-2xl
        transition-all duration-300
        ${glow ? 'shadow-glow' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}
