# AI Documentation Structure

## Workflow-Overview

Dieses Verzeichnis demonstriert die vollständige Agent-Workflow-Struktur für die Entwicklung von TypeScript-Bibliotheken. Der Workflow besteht aus mehreren Phasen mit spezialisierten Agenten.

## Struktur-Erklärung

```
ai_docs/
├── [lib_name]/
│   ├── high_level/                    # Planning Phase (lib-crafter)
│   │   ├── lib-overview.md           # Strategische Vision
│   │   ├── user-stories.md           # User-zentrierte Anforderungen
│   │   ├── api.md                    # High-Level API Design
│   │   ├── milestones.md             # Implementation Roadmap
│   │   ├── handoff-summary.md        # Übergang zu Requirements
│   │   └── IAC/                      # Inter-Agent Communication
│   │       ├── interview-summary.md  # lib-interviewer → lib-researcher
│   │       └── research-findings.md  # lib-researcher → lib-doc-creator
│   │
│   └── low_level/
│       └── [session_name]/           # Session-spezifische Implementierung
│           ├── req/                  # Requirements Phase
│           │   ├── user-stories.md   # Detaillierte User Stories
│           │   ├── features.md       # Feature Specifications
│           │   ├── api.md           # Detailed API Requirements
│           │   ├── acceptance-criteria.md # Testing & Validation
│           │   └── IAC/             # Inter-Agent Communication
│           │       ├── analysis-summary.md    # analyzer → interviewer
│           │       └── interview-results.md   # interviewer → doc-creator
│           │
│           ├── design/              # System Design Phase
│           │   └── IAC/             # Inter-Agent Communication
│           │       ├── analysis-summary.md    # analyzer → interviewer
│           │       └── interview-results.md   # interviewer → researcher
│           │
│           └── dev/                 # Development Phase
│               ├── analyze/         # Analysis artifacts
│               ├── implement/       # Implementation artifacts
│               ├── test/           # Testing artifacts
│               └── finalize/       # Finalization artifacts
```

## Agent-Workflow-Phasen

### Phase 1: lib-crafter (High-Level Planning)
1. **lib-interviewer**: Sammelt strategische Requirements
2. **lib-researcher**: Führt State-of-the-art Research durch
3. **lib-doc-creator**: Erstellt comprehensive High-Level Documentation

### Phase 2: requirements-agent (Detailed Requirements)
1. **requirements-analyzer**: Analysiert High-Level-Docs und definiert Arbeitspakete
2. **requirements-interviewer**: Sammelt detaillierte User Requirements
3. **requirements-doc-creator**: Erstellt detailed Requirements Documentation

### Phase 3: systemdesign-agent (Architecture Design)
1. **systemdesign-analyzer**: Analysiert Requirements für Architecture Implications
2. **systemdesign-interviewer**: Führt Architecture Decision Interviews durch
3. **systemdesign-researcher**: Validiert Decisions gegen moderne Patterns
4. **systemdesign-doc-creator**: Erstellt comprehensive Design Documentation

### Phase 4: phaseplanner-agent (Implementation Planning)
1. **phaseplanner-analyzer**: Analysiert Design für Implementation Strategy
2. **phaseplanner-doc-creator**: Erstellt detailed Implementation Plan

### Phase 5: softwaredev-agent (Development Execution)
1. **analyze_phase**: Code Analysis und Architecture Validation
2. **implement_phase**: Feature Implementation
3. **test_phase**: Testing und Quality Assurance
4. **finalize_phase**: Release Preparation und Documentation

## Inter-Agent Communication (IAC)

### Purpose
IAC-Dateien ermöglichen nahtlose Kommunikation zwischen Agenten:
- Kontext-Übertragung zwischen Agent-Wechseln
- Vermeidung von Informationsverlust
- Strukturierte Handoff-Prozesse

### Lifecycle
- Erstellt während Agent-Execution
- Konsumiert vom nachfolgenden Agent
- Bereinigt nach Phase-Completion

## Agent-Aktivierung

### Toggle Mechanism
```bash
# Aktiviere nächsten Agent
sed -i '4s/alwaysApply: false/alwaysApply: true/' .cursor/rules/[agent]/[role].mdc

# Deaktiviere aktuellen Agent  
sed -i '4s/alwaysApply: true/alwaysApply: false/' .cursor/rules/[agent]/[role].mdc
```

### Chain Execution
Jeder Agent aktiviert automatisch den nächsten Agent in der Kette nach erfolgreicher Completion.

## Quality Gates

### Documentation Standards
- **Completeness**: Alle required sections vorhanden
- **Consistency**: Cross-references und Dependencies korrekt
- **Actionability**: Clear next steps für nachfolgende Phase
- **User-Centricity**: Focus auf Developer Experience

### Inter-Phase Validation
- High-Level Vision alignment mit Low-Level Implementation
- Requirements Traceability durch alle Phasen
- Architecture Decisions dokumentiert und begründet
- Quality Standards konsistent angewendet

## Usage Guidelines

### Für Agent-Entwicklung
1. Folge der established Struktur
2. Nutze IAC für Kontext-Übertragung
3. Implementiere proper Agent-Chain-Commands
4. Cleanup IAC nach Phase-Completion

### Für Documentation Review
1. Überprüfe Phase-Consistency
2. Validiere User Journey Completeness
3. Verifiziere Technical Decision Rationale
4. Bestätige Quality Gate Compliance

---

**Note**: Diese Struktur ist designed für iterative Verbesserung basierend auf real-world usage und community feedback. 