# Test Validation Phase

Execute comprehensive test validation for **$ARGUMENTS** using @/test-driven-core rules.

## Pre-Validation Checks
1. **Test Infrastructure Status**
   ```bash
   npm run test:infrastructure
   # Must pass before proceeding
   ```

2. **Load Test-Driven Context**
   - Apply @/test-driven-core rules
   - Focus on test suite: $ARGUMENTS
   - Ensure 100% test-first compliance

## Validation Framework

### Phase 1: Unit Test Validation
```bash
# Run isolated unit tests
npm run test:unit -- $ARGUMENTS --coverage

# Validate coverage thresholds
# Lines: >90%, Functions: >90%, Branches: >85%
```

**Requirements:**
- All unit tests pass in isolation
- Each function/class has corresponding tests
- Mocking used appropriately for external dependencies
- Test naming follows descriptive patterns

### Phase 2: API-Level Test Validation  
```bash
# Run integration tests as real users would
npm run test:api -- $ARGUMENTS --reporter=verbose

# Test actual library usage patterns
```

**Requirements:**
- Tests exactly mirror real user workflows
- Error scenarios handled gracefully
- API contract compliance verified
- Performance benchmarks within thresholds

### Phase 3: Container Test Validation
```bash
# Test in isolated container environment
docker-compose up --build test-$ARGUMENTS

# Ensure containerized consistency
docker run --rm library-test:latest npm test
```

**Requirements:**
- All tests pass in containerized environment
- No host system dependencies
- Consistent results across environments
- Performance matches expectations

### Phase 4: Performance Regression Detection
```bash
# Run performance benchmarks
npm run test:performance -- $ARGUMENTS

# Compare with baseline metrics
npm run performance:compare
```

**Requirements:**
- Performance within acceptable thresholds
- No regression from previous versions
- Memory usage within limits
- Execution time benchmarks met

## Advanced Validation Strategies

### Test Quality Assessment
```typescript
// Validate test quality patterns
describe('Test Quality Validation', () => {
  it('should have descriptive test names', () => {
    // Verify test naming conventions
  })
  
  it('should test edge cases', () => {
    // Validate edge case coverage
  })
  
  it('should have proper setup/teardown', () => {
    // Check test isolation
  })
})
```

### Coverage Gap Analysis
```bash
# Identify uncovered code paths
npm run coverage:gaps

# Generate coverage report
npm run coverage:html
open coverage/index.html
```

### Security Test Validation
```bash
# Run security-focused tests
npm run test:security -- $ARGUMENTS

# Validate input sanitization
npm run test:security:inputs
```

## Validation Deliverables

### 1. Rule-to-Rule Communication (IAC)
Update `ai_docs/*/low_level/session-*/dev/phase_X/IAC/phase-analysis.md`:
- Test validation results for finalize rule
- AI assistance effectiveness metrics
- Container validation status
- Internal quality metrics

### 2. Agent-to-Agent Communication (Final Outputs)  
Create `ai_docs/*/low_level/session-*/dev/phase_X/test-results.md`:
- Final test execution summary
- Coverage analysis results
- Performance benchmark results  
- Security validation status
- Quality gate completion status

### 2. Quality Metrics Dashboard
```json
{
  "test_suite": "$ARGUMENTS",
  "execution_time": "timestamp",
  "results": {
    "unit_tests": { "passed": 0, "failed": 0, "coverage": 0 },
    "api_tests": { "passed": 0, "failed": 0, "scenarios": 0 },
    "performance": { "baseline": 0, "current": 0, "regression": false },
    "security": { "vulnerabilities": 0, "score": 0 }
  }
}
```

### 3. Regression Analysis
- Compare with previous test runs
- Identify performance trends
- Flag quality degradation
- Recommend improvements

## Gate 3: Test Validation ✅

**Exit Criteria Checklist:**
- [ ] All unit tests pass (100%)
- [ ] All API-level tests pass (100%)
- [ ] Container tests execute successfully
- [ ] Coverage thresholds met (>90% lines, >90% functions, >85% branches)
- [ ] Performance benchmarks within acceptable range
- [ ] No security vulnerabilities detected
- [ ] Test quality assessment passed
- [ ] Regression analysis completed

**Validation Commands:**
```bash
# Complete test suite execution
npm run test:all -- $ARGUMENTS

# Generate comprehensive report
npm run test:report -- $ARGUMENTS

# Validate all quality gates
npm run validate:quality-gates
```

**Critical Failures (Stop Development):**
- Any test failures in critical paths
- Coverage below thresholds
- Performance regression >20%
- Security vulnerabilities detected
- Container environment failures

**Next Phase**: Ready for Gate 4 Quality Assurance

Remember: **Zero tolerance for failing tests** - fix before proceeding! 