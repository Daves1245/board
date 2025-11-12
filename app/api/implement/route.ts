import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { triggerImplementation } from '@/lib/trigger-implementation';

export async function POST(request: NextRequest) {
  try {
    const { title, content, id } = await request.json();

    // Get current vote count before clearing votes
    const voteCount = await prisma.vote.count({
      where: { featureId: id }
    });

    // Mark feature as "implementing" in the database
    await prisma.feature.update({
      where: { id: id },
      data: {
        status: 'implementing',
        implementationStartedAt: new Date(),
        votes: voteCount,
      }
    });

    // Clear all votes since implementation has been triggered
    await prisma.vote.deleteMany({
      where: { featureId: id }
    });

    // Trigger GitHub Action workflow
    const result = await triggerImplementation({
      featureId: id.toString(),
      title,
      description: content
    });

    if (!result.success) {
      console.error(`❌ Failed to trigger GitHub Action: ${result.message}`);
      // Return error but don't revert database changes
      return NextResponse.json({
        success: false,
        error: result.message,
        message: `Feature marked as implementing, but GitHub Action failed to trigger: ${result.message}`,
        id: id,
        implementing: true,
        status: 'implementing',
        hasVoted: false,
        voteTotal: voteCount
      }, { status: 500 });
    }

    console.log(`📋 Feature ID: ${id}, Title: ${title}`);

    return NextResponse.json({
      success: true,
      message: result.message,
      id: id,
      implementing: true,
      status: 'implementing',
      hasVoted: false, // Votes cleared
      voteTotal: voteCount
    });

  } catch (error) {
    console.error('GitHub Action trigger error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to trigger implementation',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
