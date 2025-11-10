import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { checkFeatureSubmissionLimit } from "@/lib/rate-limit"
import { z } from "zod"

const createFeatureSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  parentId: z.string().optional(),
  captchaToken: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check rate limit
    const { success } = await checkFeatureSubmissionLimit(session.user.id)
    if (!success) {
      return NextResponse.json(
        { error: 'Daily submission limit reached: 3' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { title, description, parentId, captchaToken } = createFeatureSchema.parse(body)

    // Verify CAPTCHA in production
    if (process.env.NODE_ENV === 'production' && captchaToken) {
      const captchaResponse = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: process.env.HCAPTCHA_SECRET_KEY!,
          response: captchaToken,
        }),
      })
      
      const captchaResult = await captchaResponse.json()
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: 'Verification failed. Please try again.' },
          { status: 400 }
        )
      }
    }

    // Validate parent feature if provided
    if (parentId) {
      const parentFeature = await prisma.feature.findUnique({
        where: { id: parentId }
      })
      
      if (!parentFeature) {
        return NextResponse.json(
          { error: 'Parent feature not found' },
          { status: 404 }
        )
      }
      
      if (parentFeature.implementedAt) {
        return NextResponse.json(
          { error: 'Cannot add variations to an implemented feature' },
          { status: 400 }
        )
      }
    }

    // Create feature
    const feature = await prisma.feature.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        creatorId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        creator: {
          select: { id: true, username: true, firstName: true, lastName: true }
        },
        parent: {
          select: { id: true, title: true }
        }
      }
    })

    // Automatically vote for own feature
    await prisma.vote.create({
      data: {
        userId: session.user.id,
        featureId: feature.id,
      }
    })

    return NextResponse.json({
      feature: {
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
        voteTotal: 1,
        userHasVoted: true,
        parent: feature.parent,
        variationCount: 0,
      },
      message: 'Feature created successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    }
    
    console.error('Error creating feature:', error)
    return NextResponse.json(
      { error: 'Failed to create feature' },
      { status: 500 }
    )
  }
}