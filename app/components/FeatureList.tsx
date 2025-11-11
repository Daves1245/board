'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Feature, FeaturesResponse, VoteResponse } from '@/types'
import { FeatureCard } from './FeatureCard'
import { CreateFeatureForm } from './CreateFeatureForm'
import { Toast } from './Toast'
import { LogIn, LogOut, User, UserPlus } from 'lucide-react'

export function FeatureList() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<FeaturesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'implementation' } | null>(null)

  useEffect(() => {
    fetchFeatures()
  }, [])

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/features')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result: FeaturesResponse = await response.json()
      
      // Ensure we have the expected data structure
      if (result && typeof result === 'object') {
        setData({
          features: result.features || [],
          implementingFeatures: result.implementingFeatures || [],
          implementedFeatures: result.implementedFeatures || [],
          canSubmit: result.canSubmit || false,
          user: result.user || null
        })
        setError(null)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching features:', error)
      setError(error instanceof Error ? error.message : 'Failed to load features')
      // Set default data structure to prevent undefined errors
      setData({
        features: [],
        implementingFeatures: [],
        implementedFeatures: [],
        canSubmit: false,
        user: null
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVoteChange = (featureId: string, voteResponse: VoteResponse) => {
    if (!data) return

    // Check if feature just moved to "implementing" status
    if (voteResponse.implementing && voteResponse.status === 'implementing') {
      // Move feature from pending to implementing
      const implementingFeature = data.features.find(f => f.id === featureId)

      if (implementingFeature) {
        const updatedFeature: Feature = {
          ...implementingFeature,
          status: 'implementing',
          implementationStartedAt: new Date().toISOString(),
          voteTotal: voteResponse.voteTotal,
          userHasVoted: false, // Votes are cleared when implementation starts
        }

        setData({
          ...data,
          features: data.features.filter(f => f.id !== featureId),
          implementingFeatures: [updatedFeature, ...data.implementingFeatures],
        })

        // Show implementation notification
        if (voteResponse.message) {
          setToast({
            message: voteResponse.message,
            type: 'implementation'
          })
        }

        return
      }
    }

    // Normal vote update (still pending)
    const updateFeature = (feature: Feature) =>
      feature.id === featureId
        ? {
            ...feature,
            userHasVoted: voteResponse.hasVoted,
            voteTotal: voteResponse.voteTotal,
          }
        : feature

    setData({
      ...data,
      features: (data.features || []).map(updateFeature),
    })
  }

  const handleFeatureCreated = (newFeature: Feature) => {
    if (!data) return

    setData({
      ...data,
      features: [newFeature, ...(data.features || [])],
      canSubmit: false, // Assume rate limit hit
    })
    setShowCreateForm(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="text-gray-600">Loading features...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Failed to load features</div>
          <div className="text-sm text-gray-500">{error}</div>
          <button 
            onClick={fetchFeatures}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-gray-600">No data available</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">The Board</h1>
            
            {/* Auth Controls */}
            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="text-gray-500">Loading...</div>
              ) : session ? (
                <>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="h-4 w-4" />
                    <span className="text-sm">
                      {session.user?.name || session.user?.username || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => signIn()}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </button>
                  <a
                    href="/signup"
                    className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">The Board</h1>
          <p className="text-xl text-gray-600 italic mb-6">Be careful what you wish for.</p>
          <p className="text-gray-700 max-w-2xl mx-auto mb-8">
            When any feature reaches 5 votes, it gets automatically implemented on The Board. 
            What will you make of The Board?
          </p>
        </div>

      {/* Action Section */}
      {session ? (
        // Authenticated user
        data?.user && data.canSubmit && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Feature Request
            </button>
          </div>
        )
      ) : (
        // Anonymous user - encourage sign up
        <div className="text-center mb-8">
          <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-2xl mx-auto shadow-sm">
            <h3 className="text-lg font-semibold text-black mb-2">
              Join The Board Community
            </h3>
            <p className="text-gray-900 mb-4">
              Sign up to submit feature requests, vote on features, and help shape the future of The Board!
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => signIn()}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
              <a
                href="/signup"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Sign Up</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Create Feature Form */}
      {showCreateForm && (
        <CreateFeatureForm
          onClose={() => setShowCreateForm(false)}
          onFeatureCreated={handleFeatureCreated}
        />
      )}

      {/* Pending Features (Being Voted On) */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Being Voted On
        </h2>

        {!data.features || data.features.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No features being voted on. Be the first to suggest one!
          </p>
        ) : (
          <div className="space-y-4">
            {data.features.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onVoteChange={handleVoteChange}
              />
            ))}
          </div>
        )}
      </section>

      {/* Currently Being Implemented */}
      {data.implementingFeatures && data.implementingFeatures.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🤖 Currently Being Implemented ({data.implementingFeatures.length})
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              These features reached 5 votes and are currently being implemented by our AI agent.
              Check back soon to see them in action!
            </p>
          </div>
          <div className="space-y-4">
            {data.implementingFeatures.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onVoteChange={handleVoteChange}
              />
            ))}
          </div>
        </section>
      )}

      {/* Fully Implemented Features */}
      {data.implementedFeatures && data.implementedFeatures.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ✅ Fully Implemented ({data.implementedFeatures.length})
          </h2>
          <div className="space-y-4">
            {data.implementedFeatures.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onVoteChange={handleVoteChange}
              />
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  )
}