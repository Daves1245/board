import { prisma } from './db';

interface TriggerImplementationParams {
  featureId: string;
  title: string;
  description: string;
}

/**
 * Triggers GitHub Action workflow to implement a feature
 * This is called when a feature reaches 5 votes or test button is clicked
 */
export async function triggerImplementation({
  featureId,
  title,
  description
}: TriggerImplementationParams): Promise<{ success: boolean; message: string }> {
  try {
    // Validate environment variables
    if (!process.env.GITHUB_TOKEN) {
      console.error('❌ GITHUB_TOKEN environment variable is not set');
      return {
        success: false,
        message: 'GitHub token not configured. Please set GITHUB_TOKEN in environment variables.'
      };
    }

    if (!process.env.GITHUB_REPOSITORY) {
      console.error('❌ GITHUB_REPOSITORY environment variable is not set');
      return {
        success: false,
        message: 'GitHub repository not configured. Please set GITHUB_REPOSITORY in environment variables.'
      };
    }

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
          ref: 'main',
          inputs: {
            feature_id: featureId,
            feature_title: title,
            feature_content: description
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ GitHub API error: ${response.status} - ${errorText}`);
      return {
        success: false,
        message: `GitHub API error: ${response.status}`
      };
    }

    console.log(`✅ GitHub Action triggered successfully for: "${title}"`);
    return {
      success: true,
      message: `Feature "${title}" is now being implemented by our AI agent!`
    };

  } catch (error) {
    console.error('❌ Error triggering GitHub Action:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error triggering implementation'
    };
  }
}
