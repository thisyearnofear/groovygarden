import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface EnhancedStatProps {
  value: number | string
  label: string
  icon?: React.ReactNode
  color?: string
  className?: string
}

interface EnhancedStatsProps {
  stats: EnhancedStatProps[]
  className?: string
}

export function EnhancedStat({ 
  value, 
  label, 
  icon, 
  color = "text-purple-600", 
  className 
}: EnhancedStatProps) {
  const [displayValue, setDisplayValue] = React.useState(0)
  
  React.useEffect(() => {
    if (typeof value === 'number') {
      let start = 0
      const end = value
      const duration = 1000
      const increment = end / (duration / 16)
      
      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          clearInterval(timer)
          setDisplayValue(end)
        } else {
          setDisplayValue(Math.ceil(start))
        }
      }, 16)
      
      return () => clearInterval(timer)
    } else {
      setDisplayValue(value as any)
    }
  }, [value])

  const statVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { 
      y: -5,
      transition: { type: "spring", stiffness: 300 }
    }
  }

  const iconVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.2,
      rotate: [0, 5, -5, 0],
      transition: { duration: 0.5 }
    }
  }

  return (
    <motion.div
      className={cn("text-center", className)}
      variants={statVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <motion.div
        className={cn("text-3xl font-bold mb-1", color)}
        variants={iconVariants}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {displayValue}
      </motion.div>
      <div className="text-sm text-gray-600">{label}</div>
    </motion.div>
  )
}

export function EnhancedStats({ stats, className }: EnhancedStatsProps) {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <motion.div
      className={cn("grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto", className)}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {stats.map((stat, index) => (
        <EnhancedStat
          key={index}
          value={stat.value}
          label={stat.label}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </motion.div>
  )
}