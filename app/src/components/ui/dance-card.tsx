import * as React from "react"
import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { Play, Users, Eye, TrendingUp, Clock, Zap } from "lucide-react"

interface DanceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  category?: string
  moveCount?: number
  viewCount?: number
  participantCount?: number
  createdAt?: Date
  isViral?: boolean
  isAiGenerated?: boolean
  thumbnailUrl?: string
  onPlay?: () => void
  onJoin?: () => void
  loading?: boolean
}

const DanceCard = React.forwardRef<HTMLDivElement, DanceCardProps>(
  ({ 
    className, 
    title, 
    description, 
    category, 
    moveCount = 0, 
    viewCount = 0, 
    participantCount = 0,
    createdAt,
    isViral = false,
    isAiGenerated = false,
    thumbnailUrl,
    onPlay,
    onJoin,
    loading = false,
    ...props 
  }, ref) => {
    
    const cardVariants = {
      initial: { 
        scale: 1, 
        y: 0,
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
      },
      hover: { 
        scale: 1.02,
        y: -4,
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 20 
        }
      },
      tap: { 
        scale: 0.98,
        transition: { duration: 0.1 }
      }
    }

    const iconVariants = {
      initial: { scale: 1, rotate: 0 },
      hover: { scale: 1.1, rotate: 5 },
      tap: { scale: 0.9, rotate: -5 }
    }

    const formatTimeAgo = (date: Date) => {
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
      
      if (diffInSeconds < 60) return 'Just now'
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
      return `${Math.floor(diffInSeconds / 86400)}d ago`
    }

    return (
      <motion.div
        ref={ref}
        className={cn("cursor-pointer", className)}
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        {...props}
      >
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          {/* Thumbnail/Video Preview */}
          <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <motion.div
                  variants={iconVariants}
                  className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Play className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </motion.div>
              </div>
            )}
            
            {/* Overlay badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {isViral && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <Badge variant="destructive" className="bg-gradient-to-r from-orange-500 to-red-500">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Viral
                  </Badge>
                </motion.div>
              )}
              {isAiGenerated && (
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.3 }}
                >
                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <Zap className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                </motion.div>
              )}
            </div>

            {/* Play button overlay */}
            <motion.div 
              className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
              whileHover={{ opacity: 1 }}
            >
              <motion.button
                onClick={onPlay}
                className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Play className="w-8 h-8 text-gray-800 ml-1" />
              </motion.button>
            </motion.div>
          </div>

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold truncate">{title}</CardTitle>
                {description && (
                  <CardDescription className="mt-1 line-clamp-2">{description}</CardDescription>
                )}
              </div>
              {category && (
                <Badge variant="outline" className="ml-2 shrink-0">
                  {category}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Stats row */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <Users className="w-4 h-4" />
                  <span>{participantCount}</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <Eye className="w-4 h-4" />
                  <span>{viewCount}</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <Play className="w-4 h-4" />
                  <span>{moveCount} moves</span>
                </motion.div>
              </div>
              {createdAt && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeAgo(createdAt)}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={onPlay}
                className="flex-1"
                disabled={loading}
              >
                <Play className="w-4 h-4 mr-2" />
                Watch
              </Button>
              <Button 
                onClick={onJoin}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                <Users className="w-4 h-4 mr-2" />
                Join
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
)

DanceCard.displayName = "DanceCard"

export { DanceCard }