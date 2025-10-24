import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Enhanced variants for dance app
        dance: "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:from-pink-600 hover:to-purple-700 hover:shadow-xl",
        viral: "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg hover:from-orange-600 hover:to-red-700 hover:shadow-xl",
        ai: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg hover:from-blue-600 hover:to-cyan-700 hover:shadow-xl",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-9 w-9",
      },
      animation: {
        none: "",
        bounce: "hover:scale-105 active:scale-95",
        pulse: "hover:animate-pulse",
        wiggle: "hover:animate-bounce",
        glow: "hover:shadow-2xl hover:shadow-primary/25",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "bounce",
    },
  }
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants>,
    Omit<MotionProps, "children"> {
  asChild?: boolean
  loading?: boolean
  success?: boolean
  children: React.ReactNode
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, variant, size, animation, asChild = false, loading, success, children, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button

    // Enhanced animation variants
    const motionVariants = {
      initial: { scale: 1 },
      hover: { 
        scale: animation === "bounce" ? 1.05 : 1,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      },
      tap: { 
        scale: animation === "bounce" ? 0.95 : 1,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      },
      success: {
        scale: [1, 1.1, 1],
        transition: { duration: 0.3 }
      }
    }

    const buttonContent = React.useMemo(() => {
      if (loading) {
        return (
          <>
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span>Loading...</span>
          </>
        )
      }

      if (success) {
        return (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="w-4 h-4 text-green-500"
            >
              ✓
            </motion.div>
            <span>Success!</span>
          </>
        )
      }

      return children
    }, [loading, success, children])

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        variants={motionVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        animate={success ? "success" : "initial"}
        disabled={loading || props.disabled}
        {...props}
      >
        {buttonContent}
      </Comp>
    )
  }
)
EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, buttonVariants }