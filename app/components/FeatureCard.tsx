'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Feature, VoteResponse } from '@/types'
import { VoteButton } from './VoteButton'
import { formatDistanceToNow } from 'date-fns'

interface FeatureCardProps {
  feature: Feature
  onVoteChange?: (featureId: string, response: VoteResponse) => void
  onFeatureClick?: (feature: Feature) => void
}

export function FeatureCard({ 
  feature, 
  onVoteChange, 
  onFeatureClick 
}: FeatureCardProps) {
  const { data: session } = useSession()
  const [isVoting, setIsVoting] = useState(false)
  const [isImplementing, setIsImplementing] = useState(false)

  const handleVote = async () => {
    // Prompt sign-in for anonymous users
    if (!session) {
      signIn()
      return
    }

    setIsVoting(true)
    try {
      const response = await fetch(`/api/features/${feature.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to vote')
      }

      const result: VoteResponse = await response.json()
      
      // Show implementation notification
      if (result.implemented && result.message) {
        alert(`🚀 ${result.message}`)
        // Optionally refresh the page to show updated state
        window.location.reload()
      }
      
      onVoteChange?.(feature.id, result)
    } catch (error) {
      console.error('Vote error:', error)
      // Handle error (show toast, etc.)
    } finally {
      setIsVoting(false)
    }
  }

  const handleTestImplement = async () => {
    if (!session) {
      signIn()
      return
    }

    setIsImplementing(true)
    try {
      const response = await fetch('/api/implement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: feature.id,
          title: feature.title,
          content: feature.description
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to trigger GitHub implementation')
      }

      const result = await response.json()
      
      // Show GitHub Action trigger confirmation
      alert(`🚀 ${result.message}\n\nThe feature will be implemented by our AI agent via GitHub Actions. Check the repository for a new pull request in a few minutes.`)
      
      // Mark feature as implemented in UI (the GitHub webhook will update the database when complete)
      window.location.reload()
    } catch (error) {
      console.error('GitHub implementation error:', error)
      alert(`Failed to trigger implementation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsImplementing(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 
            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={() => onFeatureClick?.(feature)}
          >
            {feature.title}
          </h3>
          
          {feature.parent && (
            <p className="text-sm text-blue-600 mt-1">
              Variation of: {feature.parent.title}
            </p>
          )}
          
          <p className="text-gray-600 mt-2 line-clamp-3">
            {feature.description}
          </p>
        </div>
        
        <VoteButton
          voted={feature.userHasVoted}
          voteCount={feature.voteTotal}
          loading={isVoting}
          onClick={handleVote}
          disabled={feature.implementedAt != null}
        />
      </div>
      
      {/* Test Implementation Button - Only show for non-implemented features */}
      {!feature.implementedAt && session && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={handleTestImplement}
            disabled={isImplementing}
            className="w-full px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-orange-300"
          >
            {isImplementing ? '🤖 Triggering GitHub Action...' : '🤖 Test Agent Implementation'}
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
        <div>
          By {feature.creator.displayName} • {' '}
          {formatDistanceToNow(new Date(feature.createdAt))} ago
        </div>
        
        {feature.variationCount && feature.variationCount > 0 && (
          <span>{feature.variationCount} variations</span>
        )}
        
        {feature.implementedAt && (
          <span className="text-green-600 font-medium">Implemented</span>
        )}
      </div>
    </div>
  )
}