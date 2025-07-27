# Library Vision Creation

Execute @/lib-crafter strategic planning for library: **$ARGUMENTS**

**Important**: This command runs ONCE per library to establish the strategic foundation.

## Pre-Execution Checks
1. **Verify this is a new library**
   ```bash
   # Check if high_level/ already exists
   if [ -d "ai_docs/$ARGUMENTS/high_level" ]; then
     echo "⚠️  Library vision already exists. Use milestone sessions for development."
     exit 1
   fi
   ```

2. **Create Initial Structure**
   ```bash
   mkdir -p ai_docs/$ARGUMENTS/high_level/IAC
   ```

## @/lib-crafter Execution Flow

### Phase 1: lib-interviewer (Vision Clarification)
- **Dopamine-optimized questioning** for cognitive workload reduction
- Focus on developer experience and problem-solving
- Avoid technical implementation details
- Capture the essence and soul of the library

**Key Questions Pattern:**
- "What problem does this library solve that no other library does quite as well?"
- "What should feel effortless when using your library?"
- "What would make a developer smile when using this?"

**Output**: `ai_docs/$ARGUMENTS/high_level/IAC/interview-summary.md`

### Phase 2: lib-researcher (Ecosystem Analysis)  
- **Deep competitive landscape research**
- **Acceleration opportunities identification**
- **Pattern analysis** for API design and DX best practices
- **No compromise principle** - only suggest libraries that align with vision

**Research Areas:**
- Direct competitors and alternatives
- Foundational libraries for acceleration
- Developer experience patterns
- Integration conventions

**Output**: `ai_docs/$ARGUMENTS/high_level/IAC/research-findings.md`

### Phase 3: lib-doc-creator (Strategic Documentation)
- Transform interview insights into strategic documentation
- Create milestone roadmap based on vision and research
- Generate user stories from developer experience insights
- Establish API vision from competitive analysis

## Strategic Deliverables

### 1. Library Vision Documents
```
ai_docs/$ARGUMENTS/high_level/
├── lib-overview.md     # Vision, scope, unique value proposition
├── api.md             # Interface vision and design principles
├── milestones.md      # Strategic development roadmap
└── user-stories.md    # Key developer scenarios and use cases
```

### 2. Research Artifacts
```
ai_docs/$ARGUMENTS/high_level/IAC/
├── interview-summary.md   # Vision clarification results
└── research-findings.md   # Competitive analysis and acceleration opportunities
```

## Vision Quality Gates

### Vision Clarity ✅
- [ ] Problem statement is crystal clear
- [ ] Unique value proposition is well-defined
- [ ] Target developer persona is specific
- [ ] Success scenarios are concrete

### Research Completeness ✅
- [ ] Competitive landscape thoroughly analyzed
- [ ] Acceleration opportunities identified
- [ ] API patterns and conventions documented
- [ ] Differentiation factors clearly articulated

### Strategic Roadmap ✅
- [ ] Milestones are logically sequenced
- [ ] Each milestone delivers user value
- [ ] Foundation-first approach maintained
- [ ] Risk factors identified and planned for

## Validation Commands
```bash
# Verify all strategic documents exist
ls -la ai_docs/$ARGUMENTS/high_level/

# Check vision completeness
grep -r "TODO\|FIXME\|TBD" ai_docs/$ARGUMENTS/high_level/

# Validate research depth
wc -l ai_docs/$ARGUMENTS/high_level/IAC/research-findings.md
```

## Exit Criteria for Library Vision
- [ ] Vision interview completed with comprehensive insights
- [ ] Competitive research thorough and actionable
- [ ] All high_level/ documentation created
- [ ] Strategic roadmap (milestones.md) ready for iterative development
- [ ] Library ready for first milestone session

## Next Phase
Once vision is complete, begin iterative milestone development:
```bash
/project:orchestrate start {milestone-1-id}
```

Remember: **Vision drives everything** - invest time here to accelerate all future development! 