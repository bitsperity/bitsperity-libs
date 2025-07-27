# Pipeline Orchestration

Execute pipeline stage **$ARGUMENTS** using @/phaseplanner-agent coordination.

## Pipeline Stage Options
- `vision` - Execute @/lib-crafter (ONCE per library)
- `start` - Initialize new milestone session
- `requirements` - Execute @/requirements-agent phase
- `architecture` - Execute @/systemdesign-agent phase  
- `planning` - Execute @/phaseplanner-agent phase
- `implementation` - Execute @/softwaredev-agent phase
- `status` - Check current pipeline status
- `reset` - Reset pipeline to last valid gate

## Stage Execution Framework

### Stage: vision (RUNS ONCE per library)
```bash
# Execute strategic library planning
@/lib-crafter

# lib-interviewer: Vision clarification
# lib-researcher: Competitive analysis & ecosystem research  
# lib-doc-creator: Generate high_level/ documentation

# Creates: ai_docs/{lib-name}/high_level/ + IAC/
```

### Stage: start  
```bash
# Initialize new milestone session (iterative)
/project:init-pipeline {milestone-id}

export DEV_SESSION="session-$(date +%Y%m%d-%H%M%S)"
export LIB_NAME="{lib-name}"
export MILESTONE_ID="{milestone-id}"

# Load high_level vision from lib-crafter
cat ai_docs/$LIB_NAME/high_level/lib-overview.md
```

### Stage: requirements  
```bash
# Apply milestone requirements analysis
@/requirements-agent
/project:requirements-analyze $MILESTONE_ID

# Validate Gate 1: Requirements
npm run validate:requirements
```

### Stage: architecture
```bash
# Apply system design for milestone
@/systemdesign-agent

# Load requirements from Agent-to-Agent outputs (not IAC)
cat ai_docs/$LIB_NAME/low_level/$DEV_SESSION/req/requirements.md
cat ai_docs/$LIB_NAME/low_level/$DEV_SESSION/req/milestone-spec.md

# Generate architecture artifacts
# Validate Gate 2: Architecture
npm run validate:architecture
```

### Stage: planning
```bash
# Apply phase planning for milestone  
@/phaseplanner-agent

# Load architecture from Agent-to-Agent outputs (not IAC)
cat ai_docs/$LIB_NAME/low_level/$DEV_SESSION/design/architecture.md
cat ai_docs/$LIB_NAME/low_level/$DEV_SESSION/design/api-contracts.md
cat ai_docs/$LIB_NAME/low_level/$DEV_SESSION/design/technology-stack.md
cat ai_docs/$LIB_NAME/low_level/$DEV_SESSION/design/quality-strategy.md

# Generate phase plans and orchestration
# Validate Gate 3: Planning
npm run validate:planning
```

### Stage: implementation
```bash
# Apply software development for planned phases
@/softwaredev-agent

# Load phase plans from Agent-to-Agent outputs (not IAC)
cat ai_docs/$LIB_NAME/low_level/$DEV_SESSION/plan/phase-plan.md
cat ai_docs/$LIB_NAME/low_level/$DEV_SESSION/plan/timeline.md

# Execute 4-phase development cycle:
# 1. analyze_phase - AI assistance mapping
# 2. implement_phase - Test-driven development  
# 3. test_phase - Comprehensive validation
# 4. finalize_phase - Quality assurance

# Validate Gate 4: Implementation
npm run validate:implementation
```

### Stage: validation
```bash
# Execute comprehensive test validation
/project:test-validate {test-suite}

# Validate Gate 3
npm run validate:quality-gates
```

### Stage: quality
```bash
# Final quality assurance
npm run security:audit
npm run performance:benchmark
npm run docs:validate
npm run release:prepare

# Validate Gate 4
npm run validate:release-readiness
```

## Pipeline Status Dashboard

### Current Session Information
```bash
echo "Pipeline Status for $LIB_NAME"
echo "Session: $DEV_SESSION"
echo "Current Stage: $ARGUMENTS"
echo "Last Update: $(date)"
```

### Gate Status Summary
```bash
# Check all phase gates
echo "Gate 0 (Infrastructure): $(npm run test:infrastructure --silent && echo '✅' || echo '❌')"
echo "Gate 1 (Requirements): $(npm run validate:requirements --silent && echo '✅' || echo '❌')"  
echo "Gate 2 (Architecture): $(npm run validate:architecture --silent && echo '✅' || echo '❌')"
echo "Gate 3 (Implementation): $(npm run validate:implementation --silent && echo '✅' || echo '❌')"
echo "Gate 4 (Quality): $(npm run validate:quality --silent && echo '✅' || echo '❌')"
```

### Sophisticated Agent Communication Status Check
```bash
# Verify sophisticated communication integrity
find ai_docs/$LIB_NAME -name "*.md" -exec wc -l {} + | sort -n
echo "=== Rule-to-Rule Communication (IAC) ==="
echo "Requirements IAC: $(ls -la ai_docs/$LIB_NAME/low_level/$DEV_SESSION/req/IAC/ 2>/dev/null | wc -l) files"
echo "Design IAC: $(ls -la ai_docs/$LIB_NAME/low_level/$DEV_SESSION/design/IAC/ 2>/dev/null | wc -l) files"  
echo "Planning IAC: $(ls -la ai_docs/$LIB_NAME/low_level/$DEV_SESSION/plan/IAC/ 2>/dev/null | wc -l) files"
echo "Development IAC: $(ls -la ai_docs/$LIB_NAME/low_level/$DEV_SESSION/dev/phase_*/IAC/ 2>/dev/null | wc -l) files"
echo ""
echo "=== Agent-to-Agent Communication (Final Outputs) ==="
echo "Requirements: $(ls -la ai_docs/$LIB_NAME/low_level/$DEV_SESSION/req/*.md 2>/dev/null | grep -v IAC | wc -l) final docs"
echo "Design: $(ls -la ai_docs/$LIB_NAME/low_level/$DEV_SESSION/design/*.md 2>/dev/null | grep -v IAC | wc -l) final docs"
echo "Planning: $(ls -la ai_docs/$LIB_NAME/low_level/$DEV_SESSION/plan/*.md 2>/dev/null | grep -v IAC | wc -l) final docs"
echo "Development: $(ls -la ai_docs/$LIB_NAME/low_level/$DEV_SESSION/dev/phase_*/*.md 2>/dev/null | grep -v IAC | wc -l) final docs"
```

## Error Recovery Procedures

### Pipeline Reset
```bash
# Reset to last valid gate
git stash push -m "Pipeline reset $(date)"
git checkout main
git clean -fd

# Clear sophisticated agent communication cache  
rm -rf ai_docs/*/low_level/session-*/req/IAC/*.tmp
rm -rf ai_docs/*/low_level/session-*/design/IAC/*.tmp  
rm -rf ai_docs/*/low_level/session-*/plan/IAC/*.tmp
rm -rf ai_docs/*/low_level/session-*/dev/phase_*/IAC/*.tmp

# Restart from last successful gate
```

### Phase Rollback
```bash
# Return to previous phase
git log --oneline --grep="Gate [0-4] Passed" -n 1
git reset --hard {last-gate-commit}

# Clear failed phase artifacts  
rm -rf ai_docs/*/low_level/session-*/{agent-name}/IAC/{current-phase}*
```

### Quality Override
```bash
# Emergency quality gate bypass (use sparingly)
echo "QUALITY_OVERRIDE: $ARGUMENTS" >> pipeline.log
echo "Reason: Emergency deployment required" >> pipeline.log
echo "Timestamp: $(date)" >> pipeline.log
echo "Approved by: Solo Developer" >> pipeline.log

# Proceed with documented risk
```

## Success Metrics Tracking

### Performance Metrics
```json
{
  "pipeline_metrics": {
    "session_id": "$DEV_SESSION",
    "library_name": "$LIB_NAME", 
    "stage": "$ARGUMENTS",
    "timestamp": "$(date -Iseconds)",
    "phase_duration": {
      "requirements": "XX minutes",
      "architecture": "XX minutes", 
      "implementation": "XX hours",
      "validation": "XX minutes",
      "quality": "XX minutes"
    },
    "quality_scores": {
      "test_coverage": "XX%",
      "performance_score": "XX/100",
      "security_score": "XX/100",
      "documentation_score": "XX/100"
    }
  }
}
```

### AI Effectiveness Tracking  
```bash
# Track AI assistance effectiveness per phase
echo "AI Assistance Report for $ARGUMENTS:" >> ai_effectiveness.log
echo "High-value tasks completed: XX" >> ai_effectiveness.log
echo "Medium-value tasks completed: XX" >> ai_effectiveness.log  
echo "Manual intervention required: XX" >> ai_effectiveness.log
echo "Overall productivity gain: XX%" >> ai_effectiveness.log
```

## Pipeline Completion

### Successful Pipeline Execution
```bash
# Mark pipeline as complete
echo "🎉 Pipeline completed successfully!"
echo "Library: $LIB_NAME"
echo "Session: $DEV_SESSION"  
echo "Final Status: Production Ready"

# Archive session artifacts
tar -czf "pipeline-$LIB_NAME-$DEV_SESSION.tar.gz" ai_docs/$LIB_NAME/

# Tag release
git tag -a "v$(npm pkg get version | tr -d '"')" -m "Pipeline completion: $DEV_SESSION"
```

### Next Steps Recommendation
```bash
echo "🚀 Recommended next actions:"
echo "1. Deploy to production environment"
echo "2. Update documentation website"
echo "3. Announce release to community"
echo "4. Start next milestone development"
```

Remember: **Pipeline orchestration ensures consistency** - follow the flow, trust the process! 