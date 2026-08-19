export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 0.8 },
}

export const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -30 },
}

export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: 30 },
}

export const bounce = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 2 },
  },
}

export const pulse = {
  animate: {
    opacity: [1, 0.7, 1],
    transition: { duration: 2, repeat: Infinity },
  },
}

export const shimmer = {
  animate: {
    backgroundPosition: ['200% center', '-200% center'],
    transition: { duration: 2, repeat: Infinity },
  },
}
