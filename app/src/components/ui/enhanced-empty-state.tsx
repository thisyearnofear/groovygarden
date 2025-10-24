import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EnhancedEmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EnhancedEmptyState({ 
  title, 
  description, 
  icon,
  action,
  className 
}: EnhancedEmptyStateProps) {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const iconVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay: 0.1
      }
    }
  }

  const titleVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { delay: 0.2 }
    }
  }

  const descriptionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { delay: 0.3 }
    }
  }

  const buttonVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { delay: 0.4 }
    }
  }

  return (
    <motion.div
      className={cn("text-center py-12", className)}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {icon && (
        <motion.div
          className="mx-auto mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100"
          variants={iconVariants}
        >
          <div className="text-purple-600">
            {icon}
          </div>
        </motion.div>
      )}
      
      <motion.h3
        className="text-2xl font-bold text-gray-900 mb-2"
        variants={titleVariants}
      >
        {title}
      </motion.h3>
      
      <motion.p
        className="text-gray-600 mb-6 max-w-md mx-auto"
        variants={descriptionVariants}
      >
        {description}
      </motion.p>
      
      {action && (
        <motion.div variants={buttonVariants}>
          <Button 
            onClick={action.onClick}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}