# Requirements Analysis Phase

Analyze milestone **$ARGUMENTS** using @/requirements-agent rules.

## Pre-Phase Validation
1. **Verify IAC Structure Exists**
   ```bash
   ls ai_docs/*/high_level/{lib-overview,api,milestones,user-stories}.md
   ```

2. **Load Requirements Agent Context**
   - Apply @/requirements-agent rules
   - Focus on milestone: $ARGUMENTS
   - Technical complexity assessment required

## Analysis Workflow

### Step 1: Milestone Selection & Validation
- Load `ai_docs/*/high_level/milestones.md`
- Identify milestone $ARGUMENTS specifications
- Validate scope is achievable in 1-2 weeks
- Assess foundation value for future milestones

### Step 2: Technical Complexity Assessment
Score complexity (1-5 scale) for:
- **Domain Knowledge** (crypto, protocols, ML)
- **Integration Complexity** (APIs, external services)  
- **Performance Requirements** (latency, throughput)
- **Security Considerations** (auth, encryption, validation)

### Step 3: AI Assistance Level Mapping
Categorize development tasks:
- **High AI Assistance (80-90%)**: Tests, boilerplate, config
- **Medium AI Assistance (50-70%)**: API design, utilities  
- **Low AI Assistance (20-30%)**: Core logic, algorithms

### Step 4: Test-First Requirements Definition
For each requirement, generate:
```typescript
describe('Milestone $ARGUMENTS Requirements', () => {
  it('should satisfy core functionality', () => {
    // Testable success criteria
  })
  
  it('should handle error scenarios', () => {
    // Error handling validation
  })
  
  it('should meet performance requirements', () => {
    // Performance benchmarks
  })
})
```

## Deliverables

### 1. Rule-to-Rule Communication (IAC)
Create `ai_docs/*/low_level/session-*/req/IAC/analysis-summary.md`:
- Technical complexity analysis for interviewer
- AI assistance viability assessment  
- Critical questions identified
- Interview preparation data

Create `ai_docs/*/low_level/session-*/req/IAC/interview-preparation.md`:
- Enhanced guide for requirements interviewer
- Dopamine-optimized question strategies
- Developer personas and success scenarios

### 2. Agent-to-Agent Communication (Final Outputs)
Create `ai_docs/*/low_level/session-*/req/requirements.md`:
- Final milestone specification
- Complete technical requirements
- Success criteria with test scenarios
- Developer value proposition

Create `ai_docs/*/low_level/session-*/req/milestone-spec.md`:
- Milestone scope definition
- Implementation boundaries
- Dependencies and constraints
- Handoff instructions for systemdesign-agent

### 2. Test Scenarios
Create `tests/requirements/milestone-$ARGUMENTS.test.ts`:
- Comprehensive test suite for requirements validation
- Performance benchmarks
- Error handling test cases

### 3. Architecture Inputs
Prepare inputs for @/systemdesign-agent:
- API surface requirements
- Integration points needed
- Performance constraints
- Security requirements

## Gate 1: Requirements Validation ✅

**Exit Criteria Checklist:**
- [ ] Milestone $ARGUMENTS fully analyzed and scoped
- [ ] Technical complexity assessed and documented
- [ ] Test scenarios written and executable
- [ ] Rule-to-Rule communication complete in req/IAC/ 
- [ ] Agent-to-Agent outputs complete (requirements.md & milestone-spec.md)
- [ ] Architecture inputs prepared
- [ ] Stakeholder validation complete (if applicable)

**Validation Commands:**
```bash
# Verify requirements completeness
npm run validate:requirements

# Test scenarios compilation check
npm run test:requirements -- --reporter=verbose

# Requirements agent sophisticated communication validation
grep -r "TODO\|FIXME" ai_docs/*/low_level/session-*/req/IAC/
grep -r "TODO\|FIXME" ai_docs/*/low_level/session-*/req/*.md
```

**Next Phase**: Ready for @/systemdesign-agent Phase 2

Remember: **No architecture decisions yet** - focus on WHAT developers need, not HOW to build it! 