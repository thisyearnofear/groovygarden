import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  icon?: React.ReactNode
  gradient?: boolean
  hoverEffect?: boolean
  className?: string
  children: React.ReactNode
}

export function EnhancedCard({
  title,
  description,
  icon,
  gradient = true,
  hoverEffect = true,
  className,
  children,
  ...props
}: EnhancedCardProps) {
  const cardVariants = {
    initial: { 
      scale: 1, 
      y: 0,
      boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
    },
    hover: hoverEffect ? { 
      scale: 1.02,
      y: -4,
      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    } : {},
    tap: hoverEffect ? { 
      scale: 0.98,
      transition: { duration: 0.1 }
    } : {}
  }

  return (
    <motion.div
      className={cn("cursor-pointer", className)}
      variants={cardVariants}
      initial="initial"
      whileHover={hoverEffect ? "hover" : undefined}
      whileTap={hoverEffect ? "tap" : undefined}
      {...props}
    >
      <Card className={cn(
        "overflow-hidden border-0",
        gradient ? "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800" : "bg-white dark:bg-gray-900"
      )}>
        {(title || description || icon) && (
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {title && (
                  <CardTitle className="text-lg font-bold truncate flex items-center">
                    {icon && <span className="mr-2">{icon}</span>}
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription className="mt-1">{description}</CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  )
}