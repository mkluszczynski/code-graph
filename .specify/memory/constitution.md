<!--
Sync Impact Report - Constitution Update
═══════════════════════════════════════════════════════════════════════════════
Version Change: [INITIAL] → 1.0.0
Change Type: MAJOR - Initial constitution establishment

Modified Principles:
  • NEW: I. Clean Code First
  • NEW: II. Feature-Driven Structure
  • NEW: III. Test-First Development (NON-NEGOTIABLE)
  • NEW: IV. User Experience Above All

Added Sections:
  • Core Principles (4 principles established)
  • Code Quality Standards
  • Development Workflow
  • Governance

Removed Sections: None (initial version)

Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section aligns with principles
  ✅ spec-template.md - User Scenarios & Testing aligns with UX principle
  ✅ tasks-template.md - Test-first workflow aligns with TDD principle

Follow-up TODOs: None

Rationale for v1.0.0 MAJOR:
  Initial constitution establishing foundational governance for code-graph project.
  All four principles are non-negotiable and define the project's core identity.
═══════════════════════════════════════════════════════════════════════════════
-->

# Code Graph Constitution

## Core Principles

### I. Clean Code First

All code MUST prioritize readability, maintainability, and simplicity over cleverness
or premature optimization.

**Non-negotiable rules:**

- Functions MUST have a single, clear responsibility (Single Responsibility Principle)
- Names MUST be descriptive and reveal intent - no abbreviations except industry-standard
  ones (e.g., `id`, `url`, `api`)
- Code MUST be self-documenting; comments explain WHY, not WHAT
- Complexity MUST be justified in writing before implementation
- Magic numbers and strings are FORBIDDEN - use named constants
- No code duplication - DRY (Don't Repeat Yourself) is mandatory
- Files MUST stay under 300 lines; functions under 50 lines except when justified

**Rationale:** Clean code reduces cognitive load, accelerates onboarding, minimizes bugs,
and makes the codebase sustainable over time. Technical debt compounds exponentially;
prevention is orders of magnitude cheaper than remediation.

### II. Feature-Driven Structure

Code organization MUST follow feature boundaries, not technical layers. Files and
directories MUST be organized by domain concepts and user-facing capabilities.

**Non-negotiable rules:**

- Primary organization is by feature/domain, not by technology (no top-level
  `controllers/`, `services/`, `models/` directories)
- Each feature module MUST be independently understandable and testable
- Feature modules MUST have clear boundaries and minimal coupling
- Shared utilities go in a `shared/` or `lib/` directory, but MUST have clear purpose
- Directory names MUST reflect user-facing features or domain concepts
- A developer MUST be able to find all code for a feature in one place

**Example structure:**

```
src/
├── graph-analysis/          # Feature: graph analysis capabilities
│   ├── models/
│   ├── services/
│   └── tests/
├── visualization/           # Feature: graph visualization
│   ├── renderers/
│   ├── layouts/
│   └── tests/
└── shared/                  # Only truly shared utilities
    └── utils/
```

**Rationale:** Feature-driven structure reduces cognitive overhead, makes impact
analysis trivial, enables parallel development, and aligns code organization with
how users think about the product. It prevents the "where does this go?" problem.

### III. Test-First Development (NON-NEGOTIABLE)

Test-Driven Development (TDD) is MANDATORY. Tests MUST be written and approved
before implementation begins.

**Non-negotiable rules:**

- Red-Green-Refactor cycle is strictly enforced:
  1. Write test cases based on specifications
  2. Verify tests FAIL (red)
  3. Implement minimum code to pass tests (green)
  4. Refactor while keeping tests green
- User stories MUST have acceptance scenarios before any code is written
- Contract tests MUST exist for all public APIs and module boundaries
- Integration tests MUST cover cross-feature interactions
- Unit tests MUST achieve >80% coverage for business logic
- No code review approval until tests pass and coverage requirements are met
- Tests MUST be independent, repeatable, and fast (<5s for unit tests)

**Rationale:** TDD prevents over-engineering, ensures requirements are clear before
coding starts, provides living documentation, catches regressions immediately, and
creates a safety net for refactoring. Retrofitting tests is 10x more expensive.

### IV. User Experience Above All

Every decision MUST be evaluated through the lens of user impact. Developer
convenience is secondary to user value.

**Non-negotiable rules:**

- Features MUST start with user scenarios, not technical specifications
- User stories MUST be prioritized (P1, P2, P3...) and independently deliverable
- Error messages MUST be actionable and user-friendly, not technical stack traces
- Performance MUST meet user expectations - measure from user's perspective
- APIs MUST be intuitive and consistent - if it surprises users, it's wrong
- Documentation MUST be written for users first, then developers
- UI/CLI design MUST follow the principle of least surprise
- User feedback MUST be incorporated into prioritization decisions

**Rationale:** Products exist to solve user problems. Technical excellence that
doesn't translate to user value is waste. User-centric design creates loyal users,
reduces support burden, and guides architectural decisions effectively.

## Code Quality Standards

**Linting and Formatting:**

- All code MUST pass configured linters without exceptions
- Code formatting MUST be automated (e.g., Prettier, Black, rustfmt)
- Pre-commit hooks MUST enforce formatting and linting

**Code Review:**

- All code MUST be reviewed by at least one other developer
- Reviews MUST verify compliance with all four core principles
- Reviewers MUST verify tests exist and pass before approving
- Review comments MUST reference specific principles when flagging violations

**Performance:**

- Performance requirements MUST be defined in specifications
- Performance MUST be measured, not assumed
- Performance regressions MUST block merges

## Development Workflow

**Feature Development:**

1. Create feature specification with user scenarios (spec.md)
2. Create implementation plan with constitution check (plan.md)
3. Write tests based on acceptance scenarios
4. Verify tests fail (red)
5. Implement feature to pass tests (green)
6. Refactor while maintaining green tests
7. Review for principle compliance
8. Merge only after all gates pass

**Constitution Gates:**

- **Clean Code Gate:** No functions >50 lines, no files >300 lines, no code smells
- **Structure Gate:** Feature organized by domain, not technology layers
- **Test Gate:** All tests written first, passing, >80% coverage achieved
- **UX Gate:** User scenarios defined and testable, error messages validated

**Breaking the Rules:**

- Violations MUST be documented and justified in writing
- Justifications MUST include: why necessary, what alternatives were considered,
  mitigation plan, timeline for remediation
- Temporary violations MUST have tracking issues and sunset dates

## Governance

**Authority and Precedence:**

- This constitution supersedes all other development practices and guidelines
- When in conflict, principles take precedence over convenience
- All PRs and code reviews MUST verify compliance with constitutional principles

**Amendment Process:**

- Constitution amendments require written proposal with rationale
- Amendments MUST include impact analysis on existing code and processes
- Version numbering follows semantic versioning:
  - MAJOR: Principle removal, redefinition, or backward-incompatible governance changes
  - MINOR: New principle added or substantial expansion of existing guidance
  - PATCH: Clarifications, wording improvements, non-semantic refinements
- Amendments MUST include synchronization plan for all dependent templates and docs

**Compliance and Review:**

- All code contributions MUST pass constitutional gates
- Quarterly reviews MUST assess adherence and identify areas for improvement
- Constitution violations MUST be tracked and addressed systematically

**Living Document:**

- This constitution evolves with the project's needs
- Feedback from development practice MUST inform amendments
- Amendments propagate to `.specify/templates/` and related documentation

**Version**: 1.0.0 | **Ratified**: 2025-11-13 | **Last Amended**: 2025-11-13
