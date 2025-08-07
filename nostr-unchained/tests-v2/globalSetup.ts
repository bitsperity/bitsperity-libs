import { execSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Vitest Global Setup for tests-v2
 * - Starts ephemeral relay via docker-compose before tests
 * - Stops relay after tests to ensure no persistence between runs
 */
export default async function globalSetup() {
  const repoRoot = process.cwd();
  const script = join(repoRoot, 'scripts', 'test-relay.sh');

  try {
    // Ensure fresh start (script already downs previous containers)
    execSync(`bash ${script} start`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to start test relay via docker-compose:', error);
    throw error;
  }

  // Return teardown
  return async () => {
    try {
      execSync(`bash ${script} stop`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to stop test relay via docker-compose:', error);
    }
  };
}


