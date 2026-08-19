import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { fadeInUp } from '../lib/animations'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
}

export function AnimatedCard({ children, className = '', delay = 0, hover = true }: AnimatedCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay }}
      whileHover={hover ? { y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' } : undefined}
      className={`bg-white dark:bg-slate-900 rounded-lg shadow-md transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  )
}
