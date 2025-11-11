import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Mark a feature as fully implemented (called by GitHub Actions after successful workflow)
 * This endpoint is used internally by the auto-implementation system
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify the request is from our GitHub Action workflow
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.GITHUB_TOKEN || process.env.NEXTAUTH_SECRET

    // Simple auth check - in production you might want something more robust
    if (!authHeader || !authHeader.includes(expectedSecret || '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: featureId } = await params

    // Find feature
    const feature = await prisma.feature.findUnique({
      where: { id: featureId }
    })

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }

    if (feature.status === 'implemented') {
      return NextResponse.json(
        { message: 'Feature already marked as implemented' },
        { status: 200 }
      )
    }

    // Mark feature as implemented
    const updatedFeature = await prisma.feature.update({
      where: { id: featureId },
      data: {
        status: 'implemented',
        implementedAt: new Date(),
      }
    })

    console.log(`✅ Feature marked as implemented: "${updatedFeature.title}"`)

    return NextResponse.json({
      success: true,
      message: `Feature "${updatedFeature.title}" marked as implemented`,
      feature: {
        id: updatedFeature.id,
        title: updatedFeature.title,
        status: updatedFeature.status,
        implementedAt: updatedFeature.implementedAt
      }
    })

  } catch (error) {
    console.error('Error marking feature as complete:', error)
    return NextResponse.json(
      { error: 'Failed to mark feature as complete' },
      { status: 500 }
    )
  }
}
