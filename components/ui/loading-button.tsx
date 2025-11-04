"use client"

import { Button } from "./button"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({
  isLoading,
  loadingText = "처리중",
  children,
  className,
  ...props
}: LoadingButtonProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === "...") return ""
          return prev + "."
        })
      }, 500)

      return () => clearInterval(interval)
    }
  }, [isLoading])

  return (
    <Button
      {...props}
      disabled={isLoading || props.disabled}
      className={cn(
        "relative min-w-[200px]",
        isLoading && "cursor-wait",
        className
      )}
    >
      <span className={cn("transition-opacity", isLoading && "opacity-0")}>
        {children}
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          {loadingText}{dots}
        </span>
      )}
    </Button>
  )
}