import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface EnhancedTabsProps {
  tabs: {
    id: string
    label: string
    content: React.ReactNode
  }[]
  defaultTab?: string
  className?: string
}

export function EnhancedTabs({ 
  tabs, 
  defaultTab = tabs[0]?.id,
  className 
}: EnhancedTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab)

  const tabVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    hover: { 
      y: -2,
      transition: { type: "spring", stiffness: 300 }
    },
    active: { 
      y: -2,
      scale: 1.05,
      transition: { type: "spring", stiffness: 300 }
    }
  }

  const indicatorVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Tab List */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={cn(
              "px-4 py-2 font-medium text-sm relative",
              activeTab === tab.id 
                ? "text-purple-600" 
                : "text-gray-500 hover:text-gray-700"
            )}
            variants={tabVariants}
            initial="initial"
            animate={activeTab === tab.id ? "active" : "animate"}
            whileHover="hover"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-600"
                layoutId="activeTab"
                variants={indicatorVariants}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            className={cn(activeTab !== tab.id && "hidden")}
            initial={{ opacity: 0 }}
            animate={{ opacity: activeTab === tab.id ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {tab.content}
          </motion.div>
        ))}
      </div>
    </div>
  )
}