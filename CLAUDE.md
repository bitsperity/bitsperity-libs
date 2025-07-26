# Bitsperity Development Pipeline - Claude Code Optimized

## Core Philosophy: Test-Driven AI-Accelerated Solo Development

**Mission**: State-of-the-art TypeScript library development using AI-first approach with enterprise-level quality gates.

### Evolution from Cursor Pipeline
- **Inherits**: 22-agent sophistication from .cursor/rules (10,226 lines of specialized AI rules)
- **Enhances**: Test-first discipline from test-driven-core mockup
- **Optimizes**: Claude Code native tooling and workflow integration
- **Result**: Best-in-class AI-assisted TypeScript library development pipeline

---

## Pipeline Architecture Overview

### Enhanced 5-Rule Development System (Cursor-Evolved)
```
Requirements → Architecture → Planning → Implementation → Validation
     ↓              ↓            ↓          ↓             ↓
@/requirements → @/systemdesign → @/phaseplanner → @/softwaredev → @/test-validator
```

#### Test-First Integration (from test-driven-core)
```
Phase Gate 0: Test Infrastructure ✅ → Phase Gate 1: Requirements ✅ 
     → Phase Gate 2: Architecture ✅ → Phase Gate 3: Implementation ✅
```

### Strategic Planning (Runs ONCE per library)
```
@/lib-crafter → high_level/ documentation & vision
```

### Communication Architecture

#### Rule-to-Rule Communication (IAC Folders)
**Purpose**: Internal communication between rules within the same agent
- `requirements-analyzer.mdc` → `requirements-interviewer.mdc` → `requirements-doc-creator.mdc`
- `systemdesign-analyzer.mdc` → `systemdesign-interviewer.mdc` → `systemdesign-researcher.mdc` → `systemdesign-doc-creator.mdc`
- `analyze_phase.mdc` → `implement_phase.mdc` → `test_phase.mdc` → `finalize_phase.mdc`

#### Agent-to-Agent Communication (Outside IAC)
**Purpose**: Final outputs that flow between different agents  
- `requirements-agent` → `systemdesign-agent` → `phaseplanner-agent` → `softwaredev-agent`
- These are the "finished products" of each agent for consumption by the next agent

### IAC Communication Structure
```
ai_docs/{lib-name}/
├── high_level/          # Created by @/lib-crafter (RUNS ONCE)
│   ├── lib-overview.md  # Vision & scope from interview
│   ├── api.md          # Interface definitions from research
│   ├── milestones.md   # Strategic development phases
│   ├── user-stories.md # Use cases from vision clarification
│   └── IAC/
│       ├── interview-summary.md  # lib-interviewer output
│       └── research-findings.md  # lib-researcher output
└── low_level/session-{id}/      # Iterative milestone development
    ├── req/            # @/requirements-agent sophisticated structure
    │   ├── IAC/        # Rule-to-Rule communication (analyzer→interviewer→doc-creator)
    │   │   ├── analysis-summary.md
    │   │   └── interview-preparation.md
    │   ├── requirements.md      # Agent-to-Agent: Final requirements specification
    │   └── milestone-spec.md    # Agent-to-Agent: Milestone definition
    ├── design/         # @/systemdesign-agent sophisticated structure
    │   ├── IAC/        # Rule-to-Rule communication (analyzer→interviewer→researcher→doc-creator)
    │   │   ├── analysis-summary.md
    │   │   └── interview-preparation.md
    │   ├── architecture.md      # Agent-to-Agent: System architecture
    │   ├── api-contracts.md     # Agent-to-Agent: Interface definitions
    │   ├── technology-stack.md  # Agent-to-Agent: Tech stack decisions
    │   └── quality-strategy.md  # Agent-to-Agent: Quality approach
    ├── plan/           # @/phaseplanner-agent sophisticated structure
    │   ├── IAC/        # Rule-to-Rule communication (analyzer→doc-creator)
    │   │   ├── analysis-summary.md
    │   │   └── phase-preparation.md
    │   ├── phase-plan.md        # Agent-to-Agent: Implementation roadmap
    │   └── timeline.md          # Agent-to-Agent: Development schedule
    └── dev/            # @/softwaredev-agent sophisticated structure
        └── phase_{X}/  # Phase-specific development artifacts
            ├── IAC/    # Rule-to-Rule communication (analyze→implement→test→finalize)
            │   ├── phase-analysis.md
            │   └── development-environment.md
            ├── implementation.md    # Agent-to-Agent: Code & features
            ├── test-results.md      # Agent-to-Agent: Validation results
            └── phase-complete.md    # Agent-to-Agent: Phase summary
```

---

## Claude Code Workflow Commands

### Strategic Library Planning (ONCE per library)
```bash
# Execute @/lib-crafter for library vision
/project:vision-create {lib-name}

# Creates high_level/ documentation and strategic roadmap
```

### Milestone Session Management (Iterative)
```bash
# Start new milestone session
claude --cache --log --allowedTools="Edit,Bash,FileSystem"

# Initialize milestone session
/project:init-pipeline {milestone-id}
```

### Pipeline Orchestration Commands
```bash
# Complete pipeline execution (Enhanced with test-first)
/project:orchestrate vision      # @/lib-crafter (once)
/project:orchestrate start       # Initialize milestone session + test infrastructure
/project:orchestrate requirements # @/requirements-agent (test-first requirements)
/project:orchestrate architecture # @/systemdesign-agent (test-validated architecture)
/project:orchestrate planning     # @/phaseplanner-agent (test-driven planning)
/project:orchestrate implementation # @/softwaredev-agent (TDD implementation)
/project:orchestrate validation   # @/test-validator (phase gate validation)

# Test-Driven Development Commands (from test-driven-core evolution)
/project:test-infrastructure     # Phase Gate 0: Setup Vitest 3.2+ environment
/project:test-requirements       # Phase Gate 1: Requirements → Tests transformation
/project:test-architecture       # Phase Gate 2: Architecture decision testing
/project:test-implementation     # Phase Gate 3: Red-Green-Refactor cycles

# Pipeline monitoring (Enhanced)
/project:orchestrate status       # Check pipeline state + test coverage
/project:gates status            # Phase gate validation status
/project:coverage report         # Real-time test coverage dashboard
```

### Individual Agent Commands
```bash
# Requirements Analysis (milestone-specific)
/project:requirements-analyze {milestone-id}

# Test Validation (implementation phase)
/project:test-validate {test-suite}

# Sophisticated Agent Workflows (preserves your advanced pipeline)
/project:agent-sophisticated requirements   # Deep requirements analysis
/project:agent-sophisticated systemdesign   # Architecture planning
/project:agent-sophisticated phaseplanner   # Phase decomposition  
/project:agent-sophisticated softwaredev    # AI-accelerated development
```

---

## Development Standards (Mandatory)

### Technology Stack (2025 State-of-the-Art)
```json
{
  "runtime": "Node.js >=20.0.0",
  "language": "TypeScript ^5.3.0", 
  "testing": "Vitest ^3.2.0",
  "build": "Vite ^5.0.0",
  "container": "Docker + Docker Compose",
  "quality": "ESLint + Prettier + Husky"
}
```

### Test-First Requirements (Enhanced from test-driven-core)
- **100% test coverage** before implementation (Vitest 3.2+ with V8 coverage)
- **Dual testing strategy**: Unit tests + API-level tests (inspired by test-driven-core)
- **Red-Green-Refactor cycles**: Mandatory TDD discipline for all features
- **Container validation**: All tests must pass in Docker environment
- **Performance benchmarks**: Automated performance regression detection
- **Phase gate validation**: Each phase unlocked only after 100% test success
- **Real-time test feedback**: Watch mode with instant validation
- **Coverage thresholds**: 90%+ lines/functions, 85%+ branches (stricter than industry standard)

### AI Assistance Levels
- **High (80-90%)**: Boilerplate, tests, docs, config
- **Medium (50-70%)**: API design, utilities, integrations  
- **Low (20-30%)**: Core logic, architecture, complex algorithms

---

## Phase Gate System

### Enhanced Phase Gate System (Cursor + Test-Driven-Core Evolution)

### Gate 0: Test Infrastructure ✅ (30-60 minutes)
```bash
npm run test:infrastructure  # Must pass before any development
npm run test:setup-vitest    # Vitest 3.2+ configuration validation
npm run test:coverage-setup  # V8 coverage provider configuration
```
**Exit Criteria**: Vitest environment operational, coverage thresholds configured

### Gate 1: Requirements Validation ✅ (Test-First Requirements)
- **Test scenarios written first** (before any design decisions)
- Milestone selected and analyzed with executable test specifications
- Technical complexity assessed through test complexity analysis
- Success criteria defined as passing test suites
- **100% requirements coverage by tests** (unique from traditional approaches)

### Gate 2: Architecture Approval ✅ (Test-Validated Architecture)
- System design validated through Architecture Decision Record (ADR) tests
- API interfaces defined and validated through contract tests
- Container environment configured with test validation
- Integration points mapped and tested
- **All architectural decisions have corresponding validation tests**

### Gate 3: Implementation Complete ✅ (TDD Implementation)
- **Red-Green-Refactor cycles completed** for all features
- All tests passing (unit + integration + API-level)
- Code coverage >90% lines/functions, >85% branches
- Container deployment successful with test validation
- Performance benchmarks met and regression-tested
- **Zero implementation without prior failing tests**

### Gate 4: Quality Assurance ✅ (Enhanced Validation)
- Security audit passed with automated security tests
- Documentation complete with example code tests
- Release preparation validated through deployment tests
- Final integration tests passed
- **Continuous test validation in production-like environment**

---

## Claude Code Best Practices

### File Organization
```
{lib-name}/
├── .claude/
│   ├── commands/           # Custom slash commands
│   └── settings.json       # Tool permissions
├── ai_docs/               # Agent IAC communication
│   └── {lib-name}/
│       ├── high_level/     # @/lib-crafter output (ONCE)
│       │   ├── lib-overview.md
│       │   ├── api.md
│       │   ├── milestones.md
│       │   ├── user-stories.md
│       │   └── IAC/
│       │       ├── interview-summary.md
│       │       └── research-findings.md
│       └── low_level/session-{id}/  # Iterative milestone sessions
│           ├── req/                  # @/requirements-agent
│           │   ├── IAC/              # Rule-to-Rule communication
│           │   ├── requirements.md   # Agent-to-Agent: Final requirements
│           │   └── milestone-spec.md # Agent-to-Agent: Milestone definition
│           ├── design/               # @/systemdesign-agent
│           │   ├── IAC/              # Rule-to-Rule communication
│           │   ├── architecture.md   # Agent-to-Agent: System architecture
│           │   ├── api-contracts.md  # Agent-to-Agent: Interface definitions
│           │   └── technology-stack.md # Agent-to-Agent: Tech stack
│           ├── plan/                 # @/phaseplanner-agent
│           │   ├── IAC/              # Rule-to-Rule communication
│           │   ├── phase-plan.md     # Agent-to-Agent: Implementation roadmap
│           │   └── timeline.md       # Agent-to-Agent: Development schedule
│           └── dev/phase_{X}/        # @/softwaredev-agent
│               ├── IAC/              # Rule-to-Rule communication
│               ├── implementation.md # Agent-to-Agent: Code & features
│               ├── test-results.md   # Agent-to-Agent: Validation results
│               └── phase-complete.md # Agent-to-Agent: Phase summary
├── src/                   # Source code
├── tests/                 # Test suites
├── docker/                # Container configs
└── docs/                  # Documentation
```

### Session Management
- Use `--cache` for long sessions with large context
- Enable `--log` for pipeline traceability
- Use `--allowedTools` for security
- Leverage streaming for real-time feedback

### Tool Integration
- **GitHub CLI**: Issue management, PR creation
- **Docker**: Container-first development
- **Vitest**: Test execution and coverage
- **TypeScript**: Type checking and compilation

---

## Pipeline Automation

### Git Workflow Integration
```bash
# Feature branch creation
git checkout -b feature/{milestone-id}-{feature-name}

# Automated quality checks
npm run validate:all

# Container deployment test
docker-compose up --build test
```

### Continuous Quality
- Pre-commit hooks for code quality
- Automated testing on every commit
- Performance regression detection
- Security vulnerability scanning

---

## Emergency Procedures

### Pipeline Reset
```bash
/project:reset-pipeline
# Clears IAC cache, resets to last valid gate
```

### Phase Rollback
```bash
/project:rollback {phase-name}
# Returns to previous successful phase gate
```

### Quality Override (Use Sparingly)
```bash
/project:quality-override {reason}
# Bypasses quality gate with justification
```

---

## Success Metrics

### Development Velocity
- Phase completion time tracking
- AI assistance effectiveness measurement
- Test coverage trend analysis
- Container deployment frequency

### Quality Indicators  
- Test pass rate (target: 100%)
- Code coverage (target: >90%)
- Performance benchmarks (automated)
- Security scan results (zero critical)

### Project Health
- Pipeline success rate
- Gate failure analysis
- Technical debt tracking
- Milestone delivery accuracy 