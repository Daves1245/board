import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { checkVoteLimit } from "@/lib/rate-limit"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: featureId } = await params

    // Check rate limit
    const { success } = await checkVoteLimit(session.user.id)
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

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

    if (feature.implementedAt) {
      return NextResponse.json(
        { error: 'Feature has already been implemented' },
        { status: 400 }
      )
    }

    // Check if user has already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_featureId: {
          userId: session.user.id,
          featureId: featureId,
        }
      }
    })

    let action: string
    if (existingVote) {
      // Remove vote
      await prisma.vote.delete({
        where: { id: existingVote.id }
      })
      action = 'removed'
    } else {
      // Add vote
      await prisma.vote.create({
        data: {
          userId: session.user.id,
          featureId: featureId,
        }
      })
      action = 'added'
    }

    // Get updated vote count
    const voteCount = await prisma.vote.count({
      where: { featureId: featureId }
    })

    const hasVoted = action === 'added'

    // Check if feature should be auto-implemented (5 votes threshold)
    if (voteCount >= 5 && feature.status === 'pending') {
      try {
        // Mark feature as "implementing" (not fully implemented yet)
        await prisma.feature.update({
          where: { id: featureId },
          data: {
            status: 'implementing',
            implementationStartedAt: new Date(),
            votes: voteCount,
          }
        })

        // Clear all votes since implementation has been triggered
        await prisma.vote.deleteMany({
          where: { featureId: featureId }
        })

        console.log(`🔄 Feature implementation started: "${feature.title}" with ${voteCount} votes`)

        // Trigger GitHub Action for implementation (fire and forget)
        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/implement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: feature.id,
            title: feature.title,
            content: feature.description
          })
        }).then((implementResponse) => {
          if (implementResponse.ok) {
            console.log(`🚀 GitHub Action triggered for: "${feature.title}"`)
          } else {
            console.error('Failed to trigger GitHub implementation')
          }
        }).catch((implementError) => {
          console.error('Error triggering auto-implementation:', implementError)
        })

        return NextResponse.json({
          action,
          hasVoted: false, // User's vote was cleared
          voteTotal: voteCount,
          implementing: true,
          status: 'implementing',
          message: `Feature "${feature.title}" reached ${voteCount} votes and is now being implemented by our AI agent!`
        })
      } catch (implementError) {
        console.error('Error starting feature implementation:', implementError)
        // Continue with normal response if implementation fails
      }
    }

    return NextResponse.json({
      action,
      hasVoted,
      voteTotal: voteCount,
      implemented: false
    })

  } catch (error) {
    console.error('Error toggling vote:', error)
    return NextResponse.json(
      { error: 'Failed to toggle vote' },
      { status: 500 }
    )
  }
}