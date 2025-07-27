# Interview Preparation - DM Fix Session Requirements

## Interview Strategy Framework

### Dopamine-Optimized Question Flow
Structure interview to maintain engagement while extracting critical requirements through progressive revelation and validation cycles.

### Primary Interview Objectives
1. **Validate issue priority ranking** from technical analysis
2. **Define success criteria** for each failing test scenario  
3. **Establish scope boundaries** (full fix vs minimal viable fix)
4. **Clarify stakeholder expectations** for timeline and quality
5. **Identify hidden requirements** not visible from test failures

## Stakeholder Personas & Success Scenarios

### Persona 1: Library Developer (Primary Stakeholder)
**Context**: Needs reliable DM functionality for nostr-unchained library users
**Success Scenario**: "Developers can implement DM features without worrying about core message delivery failures"
**Key Concerns**: API stability, backward compatibility, test coverage
**Engagement Strategy**: Focus on developer experience and API reliability

### Persona 2: Application Developer (Secondary Stakeholder)  
**Context**: Building apps using nostr-unchained with DM features
**Success Scenario**: "My chat app works reliably - messages appear in real-time for both participants"
**Key Concerns**: Performance, real-time responsiveness, error handling
**Engagement Strategy**: Emphasize user experience and real-world reliability

### Persona 3: End User (Indirect Stakeholder)
**Context**: Using applications built with nostr-unchained DM functionality
**Success Scenario**: "Messages I send appear instantly for recipients, and I receive all messages sent to me"
**Key Concerns**: Message delivery reliability, conversation continuity
**Engagement Strategy**: Focus on seamless messaging experience

## Critical Requirements Discovery Questions

### Phase 1: Priority & Impact Assessment (5-7 minutes)

#### Opening Question (Dopamine Hit)
"Looking at our test results, we have 4 critical DM failures. Which ONE would you prioritize if you could only fix one thing?"

**Follow-up Probes**:
- "What's the user impact of [selected failure]?"
- "How would users work around this currently?"
- "Is this blocking any development work?"

#### Impact Quantification
"On a scale where 1 is 'minor inconvenience' and 5 is 'completely broken', how would you rate each failure?"
- Message reception failure: [1-5]
- Bidirectional conversations: [1-5] 
- Subject threading: [1-5]
- Multi-participant rooms: [1-5]

### Phase 2: Scope Definition (8-10 minutes)

#### Core vs Extended Functionality
"For the message reception issue - do we need to fix ALL messaging scenarios, or can we focus on basic 1-on-1 DMs first?"

**Discovery Areas**:
- **Minimum Viable Fix**: What's the smallest change that delivers value?
- **Scope Creep Risks**: What features might expand beyond core fixes?
- **Future-Proofing**: Should fixes accommodate planned features?

#### API Stability Requirements
"The current DM API is `nostr.dm.with(pubkey).send(message)` - can we change this interface if needed for fixes?"

**Technical Constraints**:
- Backward compatibility requirements
- Breaking change tolerance
- Migration path for existing users

### Phase 3: Quality & Timeline Constraints (6-8 minutes)

#### Success Definition
"How will we know the DM fixes are working correctly? What should we test?"

**Success Metrics Discovery**:
- **Functional Requirements**: Message delivery, real-time updates, error handling
- **Performance Requirements**: Latency, memory usage, concurrent conversations
- **Reliability Requirements**: Error recovery, network interruption handling

#### Timeline Pressures
"Is there a deadline driving this fix? Are there other teams waiting for working DMs?"

**Resource Planning**:
- Development timeline expectations
- Testing requirements (unit vs integration vs manual)
- Release coordination needs

### Phase 4: Technical Deep-Dive (10-12 minutes)

#### Architecture Preferences
"The failures seem to be in message flow coordination. Do you prefer fixing at the subscription level, store level, or both?"

**Technical Decision Points**:
- **Subscription Strategy**: Should we fix filtering or create new subscriptions?
- **Store Architecture**: Modify existing stores or create conversation-specific stores?
- **Error Handling**: Retry logic, graceful degradation, user feedback

#### Real-World Usage Patterns
"How do you envision developers using the DM functionality? Single conversations, multiple conversations, or group rooms?"

**Usage Context Discovery**:
- Expected conversation patterns
- Concurrent usage scenarios  
- Integration with existing features

### Phase 5: Risk & Success Validation (5-7 minutes)

#### Risk Tolerance
"If we can fix 80% of cases quickly vs 100% of cases slowly, what would you prefer?"

**Risk Assessment**:
- **Development Risk**: Complex fixes vs simple fixes
- **Timeline Risk**: Incremental delivery vs complete solution
- **Quality Risk**: Partial functionality vs delayed delivery

#### Final Success Validation
"Imagine it's 2 weeks from now and the DM fixes are complete. Walk me through what you'd test to feel confident they're working."

**Success Scenario Validation**:
- End-to-end testing approach
- Real-world validation scenarios
- Acceptance criteria refinement

## Enhanced Interview Techniques

### Dopamine Optimization Strategies

#### Progressive Wins
- Start with quick agreement on obvious priorities
- Build momentum with "yes" responses
- Celebrate insights and good questions
- Frame problems as opportunities for improvement

#### Engagement Maintenance
- Use specific technical examples from failing tests
- Reference existing working functionality as anchors
- Ask for opinions and validation (not just facts)
- Summarize and confirm understanding frequently

#### Energy Management
- Keep technical deep-dives focused and time-boxed
- Alternate between detail and big picture
- Use concrete examples and scenarios
- End with clear next steps and ownership

### Advanced Probing Techniques

#### Root Cause Discovery
"The bidirectional conversation test expects 2 messages but gets 1. What scenarios could cause this?"
- Follow technical intuition
- Explore multiple hypotheses  
- Validate assumptions

#### Constraint Identification
"What would make you say 'no, we can't do that' for a DM fix approach?"
- Technical constraints
- Resource constraints
- Policy/architectural constraints

#### Future-State Visioning
"Once DMs are working perfectly, what's the next capability you'd want to build on top?"
- Integration opportunities
- Feature evolution
- Architectural decisions

## Interview Output Targets

### Requirements Specification Elements
1. **Functional Requirements**: Specific behaviors expected for each fix
2. **Non-Functional Requirements**: Performance, reliability, usability targets  
3. **Technical Constraints**: API compatibility, architectural boundaries
4. **Success Criteria**: Testable acceptance criteria for each requirement
5. **Priority Rankings**: Clear ordering of fix importance

### Architectural Input Elements  
1. **Component Boundaries**: Which systems need modification
2. **Integration Points**: How fixes interact with existing code
3. **Performance Targets**: Latency, throughput, memory requirements
4. **Error Handling Strategy**: Recovery patterns and user experience

### Implementation Guidance Elements
1. **Development Phases**: Logical ordering of fix implementation
2. **Testing Strategy**: Unit, integration, and manual testing approach
3. **Risk Mitigation**: Technical and timeline risk management
4. **Validation Approach**: How to verify fixes work in real scenarios

## Post-Interview Validation

### Requirements Completeness Check
- [ ] Each failing test has corresponding requirements
- [ ] Non-functional requirements defined and measurable
- [ ] Success criteria are testable and objective
- [ ] Scope boundaries are clear and defensible

### Technical Feasibility Validation  
- [ ] Requirements align with technical complexity assessment
- [ ] AI assistance levels mapped to requirement types
- [ ] Resource estimates support timeline expectations
- [ ] Risk mitigation strategies identified

### Stakeholder Alignment Confirmation
- [ ] Priority rankings reflect stakeholder values
- [ ] Success scenarios satisfy all personas
- [ ] Technical constraints respected
- [ ] Timeline expectations realistic

## Interview Success Metrics

### Quantitative Targets
- **Requirements Coverage**: 100% of failing tests addressed
- **Constraint Identification**: All technical/resource constraints documented
- **Success Criteria**: Measurable acceptance criteria for each requirement
- **Stakeholder Validation**: Sign-off from primary stakeholder

### Qualitative Targets
- **Clarity**: Requirements are unambiguous and actionable
- **Completeness**: No critical gaps or assumptions
- **Feasibility**: Requirements achievable within constraints
- **Value**: Clear connection between requirements and stakeholder value