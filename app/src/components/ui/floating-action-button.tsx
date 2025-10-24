import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Plus, X } from "lucide-react"

interface FloatingAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  color?: string
}

interface FloatingActionButtonProps {
  actions: FloatingAction[]
  mainIcon?: React.ReactNode
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function FloatingActionButton({
  actions,
  mainIcon = <Plus className="w-6 h-6" />,
  position = "bottom-right",
  size = "md",
  className
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6", 
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6"
  }

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14", 
    lg: "w-16 h-16"
  }

  const actionSizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-14 h-14"
  }

  const getActionPosition = (index: number) => {
    const spacing = size === "sm" ? 60 : size === "md" ? 70 : 80
    const baseOffset = spacing
    
    switch (position) {
      case "bottom-right":
      case "bottom-left":
        return { bottom: baseOffset + (index * spacing) }
      case "top-right":
      case "top-left":
        return { top: baseOffset + (index * spacing) }
      default:
        return { bottom: baseOffset + (index * spacing) }
    }
  }

  const mainButtonVariants = {
    closed: { 
      rotate: 0,
      scale: 1
    },
    open: { 
      rotate: 45,
      scale: 1.1
    }
  }

  const actionVariants = {
    closed: {
      scale: 0,
      opacity: 0,
      y: position.includes("bottom") ? 20 : -20
    },
    open: (index: number) => ({
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        delay: index * 0.1
      }
    })
  }

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  }

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating action buttons container */}
      <div className={cn("fixed z-50", positionClasses[position], className)}>
        {/* Action buttons */}
        <AnimatePresence>
          {isOpen && actions.map((action, index) => (
            <motion.button
              key={action.id}
              className={cn(
                "absolute flex items-center justify-center rounded-full shadow-lg text-white transition-all hover:scale-110 active:scale-95",
                actionSizeClasses[size],
                action.color || "bg-gray-600 hover:bg-gray-700"
              )}
              style={getActionPosition(index)}
              variants={actionVariants}
              initial="closed"
              animate="open"
              exit="closed"
              custom={index}
              onClick={() => {
                action.onClick()
                setIsOpen(false)
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {action.icon}
              
              {/* Tooltip */}
              <motion.div
                className={cn(
                  "absolute px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none",
                  position.includes("right") ? "right-full mr-3" : "left-full ml-3"
                )}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                {action.label}
                <div 
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45",
                    position.includes("right") ? "-right-1" : "-left-1"
                  )}
                />
              </motion.div>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          className={cn(
            "relative flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transition-all hover:shadow-xl",
            sizeClasses[size]
          )}
          variants={mainButtonVariants}
          animate={isOpen ? "open" : "closed"}
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {mainIcon}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 0], opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.button>
      </div>
    </>
  )
}