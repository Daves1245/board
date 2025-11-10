'use client'

import { ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoteButtonProps {
  voted: boolean
  voteCount: number
  loading?: boolean
  onClick?: () => void
  disabled?: boolean
}

export function VoteButton({ 
  voted, 
  voteCount, 
  loading, 
  onClick, 
  disabled 
}: VoteButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex flex-col items-center justify-center px-3 py-2 rounded-lg border-2 transition-colors min-w-[60px]",
        voted 
          ? "border-blue-500 bg-blue-50 text-blue-700" 
          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50",
        disabled && "opacity-50 cursor-not-allowed",
        loading && "cursor-wait"
      )}
    >
      <ChevronUp 
        className={cn(
          "h-5 w-5",
          loading && "animate-pulse"
        )} 
      />
      <span className="text-sm font-medium">{voteCount}</span>
    </button>
  )
}