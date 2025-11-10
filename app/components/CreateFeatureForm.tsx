'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Feature } from '@/types'

const createFeatureSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  parentId: z.string().optional(),
})

type CreateFeatureData = z.infer<typeof createFeatureSchema>

interface CreateFeatureFormProps {
  onClose: () => void
  onFeatureCreated: (feature: Feature) => void
  parentFeature?: { id: string; title: string }
}

export function CreateFeatureForm({ 
  onClose, 
  onFeatureCreated, 
  parentFeature 
}: CreateFeatureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFeatureData>({
    resolver: zodResolver(createFeatureSchema),
    defaultValues: {
      parentId: parentFeature?.id,
    },
  })

  const onSubmit = async (data: CreateFeatureData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/features/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create feature')
      }

      onFeatureCreated(result.feature)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-700">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              {parentFeature ? `Create Variation for "${parentFeature.title}"` : 'Submit Feature Request'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-200 mb-1">
                Title
              </label>
              <input
                {...register('title')}
                type="text"
                id="title"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief, descriptive title for your feature"
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of what you want implemented"
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-900 border border-red-700 rounded-md p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 hover:text-white transition-colors border border-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feature'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}