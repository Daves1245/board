import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { title, content, id } = await request.json();

    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    if (!process.env.GITHUB_REPOSITORY) {
      throw new Error('GITHUB_REPOSITORY environment variable is required (format: owner/repo)');
    }

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

    console.log(`🤖 Triggering GitHub Action for: "${title}"`);

    // Trigger GitHub Action workflow
    const response = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/actions/workflows/implement-feature.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main', // or your default branch
          inputs: {
            feature_id: id.toString(),
            feature_title: title,
            feature_content: content
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
    }

    console.log(`✅ GitHub Action triggered successfully for: "${title}"`);
    console.log(`📋 Feature ID: ${id}, Title: ${title}`);

    return NextResponse.json({
      success: true,
      message: `Feature "${title}" is now being implemented by our AI agent!`,
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
