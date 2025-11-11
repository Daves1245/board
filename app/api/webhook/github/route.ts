import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log('📥 GitHub webhook received:', payload.action, payload.workflow_run?.name);

    // Handle GitHub webhook for feature implementation completion
    if (payload.action === 'completed' && payload.workflow_run) {
      const { conclusion, workflow_run } = payload;

      console.log(`🔔 GitHub Action completed: ${conclusion}`);
      console.log('Workflow run:', workflow_run.name);

      // Extract feature ID from workflow run inputs or commit message
      const featureId = extractFeatureId(workflow_run, payload);

      if (featureId && conclusion === 'success') {
        // Mark feature as fully implemented in database
        try {
          const updatedFeature = await prisma.feature.update({
            where: { id: featureId },
            data: {
              status: 'implemented',
              implementedAt: new Date(),
            }
          });

          console.log(`✅ Feature marked as implemented: "${updatedFeature.title}"`);

          // Optionally notify WebSocket server about completion
          try {
            await fetch('http://localhost:8080/webhook/implementation-complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                feature_id: featureId,
                success: true,
                pr_url: workflow_run.html_url
              })
            });
          } catch (wsError) {
            console.log('WebSocket server not available (optional)');
          }
        } catch (dbError) {
          console.error('Failed to update feature status:', dbError);
        }
      } else if (featureId && conclusion !== 'success') {
        console.error(`❌ GitHub Action failed for feature ${featureId}: ${conclusion}`);
        // Optionally revert feature status back to pending
        try {
          await prisma.feature.update({
            where: { id: featureId },
            data: {
              status: 'pending', // Revert to pending if implementation failed
            }
          });
          console.log(`⚠️ Feature reverted to pending status: ${featureId}`);
        } catch (revertError) {
          console.error('Failed to revert feature status:', revertError);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('GitHub webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function extractFeatureId(workflow_run: any, payload: any): string | null {
  // Try to extract feature ID from workflow inputs first (most reliable)
  try {
    if (payload.workflow_run?.inputs?.feature_id) {
      return payload.workflow_run.inputs.feature_id;
    }

    // Look in the latest commit message for feature ID
    const commitMessage = workflow_run.head_commit?.message || '';

    // Match "feature #ID" or "Feature #ID" or just "#ID" pattern
    const idMatch = commitMessage.match(/feature[:\s]+#?([a-z0-9]+)/i) ||
                    commitMessage.match(/ID[:\s]+([a-z0-9]+)/i) ||
                    commitMessage.match(/\b([a-z0-9]{25,})\b/); // Match cuid pattern

    return idMatch ? idMatch[1] : null;
  } catch {
    return null;
  }
}