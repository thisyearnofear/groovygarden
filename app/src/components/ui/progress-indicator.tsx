import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { CheckCircle, Circle, Clock, Zap } from "lucide-react"

interface ProgressStep {
  id: string
  title: string
  description?: string
  status: "pending" | "current" | "completed" | "error"
  icon?: React.ReactNode
}

interface ProgressIndicatorProps {
  steps: ProgressStep[]
  currentStep: string
  orientation?: "horizontal" | "vertical"
  showDescriptions?: boolean
  animated?: boolean
  className?: string
}

export function ProgressIndicator({
  steps,
  currentStep,
  orientation = "horizontal",
  showDescriptions = true,
  animated = true,
  className
}: ProgressIndicatorProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep)

  const getStepIcon = (step: ProgressStep, index: number) => {
    if (step.icon) return step.icon
    
    switch (step.status) {
      case "completed":
        return <CheckCircle className="w-5 h-5" />
      case "current":
        return <Clock className="w-5 h-5" />
      case "error":
        return <Circle className="w-5 h-5" />
      default:
        return <Circle className="w-5 h-5" />
    }
  }

  const getStepColor = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return "text-green-600 bg-green-100 border-green-200"
      case "current":
        return "text-blue-600 bg-blue-100 border-blue-200"
      case "error":
        return "text-red-600 bg-red-100 border-red-200"
      default:
        return "text-gray-400 bg-gray-100 border-gray-200"
    }
  }

  const getConnectorColor = (index: number) => {
    const step = steps[index]
    const nextStep = steps[index + 1]
    
    if (step?.status === "completed") {
      return "bg-green-200"
    }
    if (step?.status === "current" && nextStep) {
      return "bg-gradient-to-r from-blue-200 to-gray-200"
    }
    return "bg-gray-200"
  }

  if (orientation === "vertical") {
    return (
      <div className={cn("space-y-4", className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            <div className="flex items-start space-x-3">
              {/* Step Icon */}
              <motion.div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                  getStepColor(step)
                )}
                initial={animated ? { scale: 0.8, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {getStepIcon(step, index)}
              </motion.div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <motion.h3
                  className={cn(
                    "text-sm font-medium transition-colors",
                    step.status === "completed" ? "text-green-900" :
                    step.status === "current" ? "text-blue-900" :
                    step.status === "error" ? "text-red-900" :
                    "text-gray-500"
                  )}
                  initial={animated ? { x: -20, opacity: 0 } : false}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                >
                  {step.title}
                </motion.h3>
                {showDescriptions && step.description && (
                  <motion.p
                    className="text-xs text-gray-500 mt-1"
                    initial={animated ? { x: -20, opacity: 0 } : false}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {step.description}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <motion.div
                className={cn(
                  "absolute left-5 top-10 w-0.5 h-6 -translate-x-0.5 transition-colors duration-300",
                  getConnectorColor(index)
                )}
                initial={animated ? { scaleY: 0 } : false}
                animate={{ scaleY: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  // Horizontal orientation
  return (
    <div className={cn("flex items-center space-x-4", className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center space-y-2">
            {/* Step Icon */}
            <motion.div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                getStepColor(step)
              )}
              initial={animated ? { scale: 0.8, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1 }}
            >
              {getStepIcon(step, index)}
            </motion.div>

            {/* Step Content */}
            <div className="text-center">
              <motion.h3
                className={cn(
                  "text-sm font-medium transition-colors",
                  step.status === "completed" ? "text-green-900" :
                  step.status === "current" ? "text-blue-900" :
                  step.status === "error" ? "text-red-900" :
                  "text-gray-500"
                )}
                initial={animated ? { y: 10, opacity: 0 } : false}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.1 }}
              >
                {step.title}
              </motion.h3>
              {showDescriptions && step.description && (
                <motion.p
                  className="text-xs text-gray-500 mt-1 max-w-24"
                  initial={animated ? { y: 10, opacity: 0 } : false}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {step.description}
                </motion.p>
              )}
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <motion.div
              className={cn(
                "flex-1 h-0.5 transition-colors duration-300",
                getConnectorColor(index)
              )}
              initial={animated ? { scaleX: 0 } : false}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Preset for dance chain creation flow
export function DanceChainProgress({ currentStep }: { currentStep: string }) {
  const steps: ProgressStep[] = [
    {
      id: "setup",
      title: "Setup",
      description: "Basic info",
      status: currentStep === "setup" ? "current" : "completed",
      icon: <Circle className="w-5 h-5" />
    },
    {
      id: "record",
      title: "Record",
      description: "First move",
      status: currentStep === "record" ? "current" : 
             currentStep === "setup" ? "pending" : "completed",
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: "publish",
      title: "Publish",
      description: "Go live",
      status: currentStep === "publish" ? "current" : 
             ["setup", "record"].includes(currentStep) ? "pending" : "completed",
      icon: <CheckCircle className="w-5 h-5" />
    }
  ]

  return <ProgressIndicator steps={steps} currentStep={currentStep} />
}