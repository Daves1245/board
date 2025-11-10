import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Handle GitHub webhook for feature implementation completion
    if (payload.action === 'completed' && payload.workflow?.name === 'Implement Feature') {
      const { conclusion, workflow_run } = payload;
      
      console.log(`🔔 GitHub Action completed: ${conclusion}`);
      
      // Extract feature ID from workflow run inputs or commit message
      const featureId = extractFeatureId(workflow_run);
      
      if (featureId) {
        // Notify WebSocket server about completion
        try {
          await fetch('http://localhost:8080/webhook/implementation-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              feature_id: featureId,
              success: conclusion === 'success',
              pr_url: workflow_run.html_url
            })
          });
        } catch (error) {
          console.error('Failed to notify WebSocket server:', error);
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

function extractFeatureId(workflow_run: any): string | null {
  // Try to extract feature ID from workflow inputs or commit message
  try {
    // Look in commit message for feature ID
    const commitMessage = workflow_run.head_commit?.message || '';
    const match = commitMessage.match(/#(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}