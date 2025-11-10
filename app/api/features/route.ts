import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { checkFeatureSubmissionLimit } from "@/lib/rate-limit"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Get pending features ordered by vote count
    const pendingFeatures = await prisma.feature.findMany({
      where: { implementedAt: null },
      include: {
        creator: {
          select: { id: true, username: true, firstName: true, lastName: true }
        },
        parent: {
          select: { id: true, title: true }
        },
        voteRecords: true,
        variations: {
          where: { implementedAt: null },
          select: { id: true }
        }
      },
      orderBy: [
        { voteRecords: { _count: 'desc' } },
        { createdAt: 'desc' }
      ]
    })

    // Get implemented features
    const implementedFeatures = await prisma.feature.findMany({
      where: { implementedAt: { not: null } },
      include: {
        creator: {
          select: { id: true, username: true, firstName: true, lastName: true }
        },
        parent: {
          select: { id: true, title: true }
        }
      },
      orderBy: [
        { implementedAt: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Get user's votes if authenticated
    const userVoteIds = session?.user?.id ? 
      await prisma.vote.findMany({
        where: { userId: session.user.id },
        select: { featureId: true }
      }).then((votes: { featureId: string }[]) => new Set(votes.map(v => v.featureId))) : 
      new Set<string>()

    // Check if user can submit
    let canSubmit = false
    if (session?.user?.id) {
      const { success } = await checkFeatureSubmissionLimit(session.user.id)
      canSubmit = success
    }

    // Format response
    const formatFeature = (feature: any) => ({
      id: feature.id,
      title: feature.title,
      description: feature.description,
      createdAt: feature.createdAt,
      implementedAt: feature.implementedAt,
      creator: {
        id: feature.creator.id,
        username: feature.creator.username,
        displayName: feature.creator.firstName || feature.creator.username,
      },
      voteTotal: feature.implementedAt ? feature.votes : feature.voteRecords.length,
      userHasVoted: userVoteIds.has(feature.id),
      parent: feature.parent,
      variationCount: feature.variations?.length || 0,
      lastUpvoteAt: feature.voteRecords?.[0]?.createdAt || null
    })

    return NextResponse.json({
      features: pendingFeatures.map(formatFeature),
      implementedFeatures: implementedFeatures.map(formatFeature),
      canSubmit,
      user: session?.user ? {
        id: session.user.id,
        username: session.user.username,
        displayName: session.user.name,
      } : null
    })
  } catch (error) {
    console.error('Error fetching features:', error)
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    )
  }
}