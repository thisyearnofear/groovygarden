import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface EnhancedHeaderProps {
  title: string
  subtitle?: string
  className?: string
  children?: React.ReactNode
}

export function EnhancedHeader({ 
  title, 
  subtitle, 
  className,
  children
}: EnhancedHeaderProps) {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const titleVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const subtitleVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, delay: 0.1 }
    }
  }

  return (
    <motion.div
      className={cn("text-center mb-8", className)}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.h1
        className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-4"
        variants={titleVariants}
      >
        {title}
      </motion.h1>
      
      {subtitle && (
        <motion.p
          className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          variants={subtitleVariants}
        >
          {subtitle}
        </motion.p>
      )}
      
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  )
}