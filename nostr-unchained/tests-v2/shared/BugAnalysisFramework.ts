/**
 * Bug Analysis Framework - Test vs Library Error Analysis
 * 
 * When tests fail, we need to determine: Is the TEST wrong or the LIBRARY wrong?
 * This framework provides systematic analysis tools for untested libraries.
 */

export interface BugReport {
  testName: string;
  expectedBehavior: string;
  actualBehavior: string;
  category: BugCategory;
  severity: BugSeverity;
  verdict: BugVerdict;
  evidence: Evidence[];
  recommendations: string[];
}

export type BugCategory = 
  | 'api-contract-violation'      // Library doesn't match documented API
  | 'protocol-non-compliance'     // Library violates Nostr NIPs  
  | 'performance-regression'      // Library slower than expected
  | 'security-vulnerability'      // Library has security flaw
  | 'race-condition'             // Timing/concurrency issue
  | 'error-handling-failure'     // Library doesn't handle errors properly
  | 'test-expectation-error'     // Test expects wrong behavior
  | 'environment-issue'          // Test environment problem
  | 'flaky-test'                // Test is non-deterministic

export type BugSeverity = 'critical' | 'high' | 'medium' | 'low' | 'trivial';

export type BugVerdict = 
  | 'library-bug'               // Library needs fixing
  | 'test-bug'                  // Test needs fixing
  | 'both-wrong'               // Both test and library wrong
  | 'spec-ambiguity'           // Specification is unclear
  | 'environment-issue'        // Neither test nor library at fault
  | 'inconclusive';            // Need more investigation

export interface Evidence {
  type: 'code-reference' | 'spec-reference' | 'behavior-observation' | 'performance-data';
  description: string;
  reference?: string;  // File path, line number, URL
  data?: any;         // Actual measurements, logs, etc.
}

export class BugAnalyzer {
  
  /**
   * Analyze a failed test to determine root cause
   */
  static analyzeFailure(
    testName: string,
    error: Error,
    context: AnalysisContext
  ): BugReport {
    
    const category = this.categorizeError(error, context);
    const evidence = this.gatherEvidence(error, context);
    const verdict = this.determineVerdict(category, evidence, context);
    const severity = this.assessSeverity(category, verdict);
    
    return {
      testName,
      expectedBehavior: context.expectedBehavior,
      actualBehavior: error.message,
      category,
      severity,
      verdict,
      evidence,
      recommendations: this.generateRecommendations(verdict, category)
    };
  }
  
  /**
   * Categorize the type of error based on failure pattern
   */
  private static categorizeError(error: Error, context: AnalysisContext): BugCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // Protocol compliance checks
    if (message.includes('invalid event') || message.includes('signature')) {
      return 'protocol-non-compliance';
    }
    
    // API contract violations
    if (message.includes('undefined') || message.includes('null')) {
      return 'api-contract-violation';
    }
    
    // Performance issues
    if (message.includes('timeout') || context.actualDuration > context.expectedMaxDuration) {
      return 'performance-regression';
    }
    
    // Race conditions
    if (message.includes('race') || stack.includes('promise') && Math.random() > 0.5) {
      return 'race-condition';
    }
    
    // Error handling failures
    if (message.includes('uncaught') || message.includes('unhandled')) {
      return 'error-handling-failure';
    }
    
    // Default: might be test expectation error
    return 'test-expectation-error';
  }
  
  /**
   * Gather evidence to support bug analysis
   */
  private static gatherEvidence(error: Error, context: AnalysisContext): Evidence[] {
    const evidence: Evidence[] = [];
    
    // Code reference evidence
    if (error.stack) {
      const stackLines = error.stack.split('\n')
        .filter(line => line.includes('src/') || line.includes('tests-v2/'))
        .slice(0, 3);
      
      stackLines.forEach(line => {
        evidence.push({
          type: 'code-reference',
          description: 'Stack trace location',
          reference: line.trim()
        });
      });
    }
    
    // Behavior observation
    evidence.push({
      type: 'behavior-observation', 
      description: 'Error message and context',
      data: {
        errorMessage: error.message,
        testContext: context.testContext,
        environment: process.env.NODE_ENV
      }
    });
    
    // Performance data if relevant
    if (context.actualDuration && context.expectedMaxDuration) {
      evidence.push({
        type: 'performance-data',
        description: 'Timing measurements',
        data: {
          expected: `<${context.expectedMaxDuration}ms`,
          actual: `${context.actualDuration}ms`,
          ratio: context.actualDuration / context.expectedMaxDuration
        }
      });
    }
    
    return evidence;
  }
  
  /**
   * Determine verdict based on evidence analysis
   */
  private static determineVerdict(
    category: BugCategory, 
    evidence: Evidence[], 
    context: AnalysisContext
  ): BugVerdict {
    
    switch (category) {
      case 'protocol-non-compliance':
        // If NIP spec is clear, this is likely library bug
        return context.hasSpecReference ? 'library-bug' : 'spec-ambiguity';
        
      case 'api-contract-violation':
        // Check if API docs match test expectations
        return context.hasDocumentationReference ? 'library-bug' : 'test-bug';
        
      case 'performance-regression':
        // Performance claims need measurement
        return evidence.some(e => e.type === 'performance-data') ? 'library-bug' : 'test-bug';
        
      case 'race-condition':
        // Race conditions are usually library bugs in single-threaded environments
        return 'library-bug';
        
      case 'error-handling-failure':
        // Unhandled errors are library responsibility
        return 'library-bug';
        
      case 'test-expectation-error':
        // Test might expect wrong behavior
        return 'test-bug';
        
      case 'flaky-test':
        // Could be test environment or library concurrency issue
        return context.isReproducible ? 'library-bug' : 'environment-issue';
        
      default:
        return 'inconclusive';
    }
  }
  
  /**
   * Assess severity based on category and verdict
   */
  private static assessSeverity(category: BugCategory, verdict: BugVerdict): BugSeverity {
    if (verdict === 'test-bug') {
      return 'low';  // Test bugs don't affect users
    }
    
    switch (category) {
      case 'security-vulnerability':
        return 'critical';
      case 'protocol-non-compliance':
        return 'high';      // Breaks compatibility
      case 'api-contract-violation':
        return 'high';      // Breaks developer experience
      case 'race-condition':
        return 'high';      // Can cause data loss
      case 'error-handling-failure':
        return 'medium';    // Can cause crashes
      case 'performance-regression':
        return 'medium';    // Affects user experience
      default:
        return 'low';
    }
  }
  
  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(verdict: BugVerdict, category: BugCategory): string[] {
    const recommendations: string[] = [];
    
    switch (verdict) {
      case 'library-bug':
        recommendations.push('🐛 FILE LIBRARY BUG: Document the issue with reproduction steps');
        recommendations.push('🔧 IMPLEMENT WORKAROUND: Add defensive coding in tests');
        recommendations.push('📋 UPDATE TODO: Add bug fix to development backlog');
        break;
        
      case 'test-bug':
        recommendations.push('🧪 FIX TEST: Update test expectations to match correct behavior');
        recommendations.push('📚 VERIFY DOCS: Check if documentation matches library behavior');
        break;
        
      case 'both-wrong':
        recommendations.push('🎯 DEFINE SPEC: Clarify correct behavior with team');
        recommendations.push('🔧 FIX BOTH: Update library and test to match spec');
        break;
        
      case 'spec-ambiguity':
        recommendations.push('📖 RESEARCH SPEC: Find official NIP specification');
        recommendations.push('🔍 CHECK REFERENCE: Look at other Nostr library implementations');
        break;
        
      case 'environment-issue':
        recommendations.push('🔧 FIX ENVIRONMENT: Update test setup or configuration');
        recommendations.push('📝 DOCUMENT: Add environment requirements to README');
        break;
        
      case 'inconclusive':
        recommendations.push('🔍 INVESTIGATE DEEPER: Gather more evidence');
        recommendations.push('📋 CREATE ISSUE: Document findings for further analysis');
        break;
    }
    
    // Category-specific recommendations
    if (category === 'race-condition') {
      recommendations.push('⏰ ADD SYNCHRONIZATION: Use proper async/await patterns');
      recommendations.push('🔒 IMPLEMENT LOCKING: Add mutex for critical sections');
    }
    
    if (category === 'protocol-non-compliance') {
      recommendations.push('🧪 ADD COMPLIANCE TEST: Create test against official spec');
      recommendations.push('📋 CROSS-REFERENCE: Compare with other implementations');
    }
    
    return recommendations;
  }
}

export interface AnalysisContext {
  testContext: string;          // What the test was trying to do
  expectedBehavior: string;     // What should happen
  actualDuration?: number;      // How long it actually took
  expectedMaxDuration?: number; // Performance expectation
  hasSpecReference: boolean;    // Is there a clear NIP spec?
  hasDocumentationReference: boolean; // Is there API documentation?
  isReproducible: boolean;      // Can we reproduce the issue?
  environment: 'test' | 'dev' | 'prod';
}

/**
 * Helper function for test files to analyze failures
 */
export function analyzeBugOnFailure(
  testName: string,
  error: Error,
  context: Partial<AnalysisContext>
): void {
  const fullContext: AnalysisContext = {
    testContext: 'Unknown test context',
    expectedBehavior: 'Unknown expected behavior', 
    hasSpecReference: false,
    hasDocumentationReference: false,
    isReproducible: true,
    environment: 'test',
    ...context
  };
  
  const report = BugAnalyzer.analyzeFailure(testName, error, fullContext);
  
  console.log('\n🔍 BUG ANALYSIS REPORT');
  console.log('='.repeat(50));
  console.log(`Test: ${report.testName}`);
  console.log(`Category: ${report.category}`);
  console.log(`Severity: ${report.severity}`);
  console.log(`Verdict: ${report.verdict}`);
  
  console.log('\n📋 Evidence:');
  report.evidence.forEach((evidence, i) => {
    console.log(`  ${i + 1}. [${evidence.type}] ${evidence.description}`);
    if (evidence.reference) console.log(`     Reference: ${evidence.reference}`);
    if (evidence.data) console.log(`     Data: ${JSON.stringify(evidence.data, null, 2)}`);
  });
  
  console.log('\n💡 Recommendations:');
  report.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  console.log('='.repeat(50));
}

/**
 * Macro for systematic bug analysis in tests
 */
export const withBugAnalysis = (
  testName: string, 
  context: Partial<AnalysisContext>
) => {
  return (testFn: () => Promise<void> | void) => {
    return async () => {
      try {
        await testFn();
      } catch (error) {
        analyzeBugOnFailure(testName, error as Error, context);
        throw error; // Re-throw so test still fails
      }
    };
  };
};