import { motion } from 'framer-motion'
import { AnimatedNumber } from './AnimatedNumber'
import { fadeInUp } from '../lib/animations'

interface StatCardProps {
  label: string
  value: number
  currency?: string
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  delay?: number
}

export function StatCard({
  label,
  value,
  currency,
  icon,
  trend,
  trendValue,
  delay = 0,
}: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-500'
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="
        bg-gradient-to-br from-slate-50 to-slate-100
        dark:from-slate-800 dark:to-slate-900
        rounded-xl p-6 shadow-lg hover:shadow-xl
        transition-all duration-300
        border border-slate-200 dark:border-slate-700
      "
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {label}
        </h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {currency ? (
              <>
                <span className="text-lg mr-1">{currency}</span>
                <AnimatedNumber value={value} />
              </>
            ) : (
              <AnimatedNumber value={value} />
            )}
          </div>
        </div>

        {trend && trendValue !== undefined && (
          <div className={`flex items-center gap-1 ${trendColor} text-sm font-semibold`}>
            <span>{trendIcon}</span>
            <span>{Math.abs(trendValue)}%</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
