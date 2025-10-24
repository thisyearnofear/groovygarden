import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface EnhancedLoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function EnhancedLoading({ 
  message = "Loading...", 
  size = "md",
  className 
}: EnhancedLoadingProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  }

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  }

  return (
    <motion.div
      className={cn("flex flex-col items-center justify-center", className)}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div
        className={cn(
          "rounded-full border-4 border-purple-200 border-t-purple-600",
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
      {message && (
        <motion.p
          className="mt-4 text-gray-600"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  )
}