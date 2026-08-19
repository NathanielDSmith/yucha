import { useEffect } from 'react'
import { useMotionValue, useTransform, motion } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  format?: (val: number) => string
  className?: string
}

export function AnimatedNumber({ value, format, className = '', duration = 1 }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, Math.round)
  const displayValue = useTransform(rounded, (val) => format ? format(val) : String(val))

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  )
}
