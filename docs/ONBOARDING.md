---
id: ONBOARDING-001
title: New Developer Onboarding Guide
version: 1.0
owner: Engineering Team
status: Active
last_updated: 2026-05-19
reviewers: Tech Lead, HR
related:
  - README.md
  - docs/README.md
  - docs/01_product/PROJECT_BRIEF.md
  - docs/02_architecture/ARCHITECTURE_OVERVIEW_V2_3.md
---

# ChatAVG v2.3 — New Developer Onboarding Guide

Welcome to the ChatAVG team! This guide will help you get up to speed quickly.

**Platform:** Experimental AI agent platform with semantic protocol, durable runtime, and sandboxing
**Stack:** Node.js, Express, SQLite, Temporal.io, LiteLLM, MCP Protocol, Vanilla JS
**Current Status:** Skeleton/MVP PoC (Hardening phase)

---

## Table of Contents

1. [Week 1: Foundation](#week-1-foundation)
2. [Week 2: Deep Dive](#week-2-deep-dive)
3. [Week 3: First Contributions](#week-3-first-contributions)
4. [Week 4: Ownership](#week-4-ownership)
5. [Good First Issues](#good-first-issues)
6. [FAQ](#faq)
7. [Contact List](#contact-list)
8. [Learning Resources](#learning-resources)

---

## Week 1: Foundation

### Day 1-2: Setup & Environment

**Goal:** Get the platform running locally

```bash
# 1. Clone repository
git clone <repo-url>
cd cons

# 2. Install dependencies
npm run setup

# 3. Configure environment variables
cp cons/chatavg/.env.example cons/chatavg/.env
# Edit .env with your API keys (OpenAI, E2B, etc.)

# 4. Start services
npm run gateway    # Terminal 1: MCP Gateway
npm run start      # Terminal 2: Main application
npm run worker     # Terminal 3: Temporal Worker
```

**Expected outcome:**
- Web UI accessible at `http://localhost:3000`
- MCP Gateway running on port 3001
- Temporal Worker connected to dev server

**Troubleshooting:**
- If Temporal fails: Ensure Temporal dev server is installed (`brew install temporal` or download from temporal.io)
- If API errors: Check `.env` file has valid OpenAI API key
- See [CURRENT_REALITY_AUDIT.md](../CURRENT_REALITY_AUDIT.md) for known issues

### Day 3-4: Read Core Documentation

**Must-read documents (in order):**

1. **[PROJECT_BRIEF.md](01_product/PROJECT_BRIEF.md)** (15 min)
   - What problem we're solving
   - Target users and use cases

2. **[VISION.md](01_product/VISION.md)** (10 min)
   - Long-term goals
   - Design principles

3. **[GLOSSARY.md](01_product/GLOSSARY.md)** (20 min)
   - Key terminology (AgentRun, Mission, Claim, Forge, etc.)
   - Save this as reference!

4. **[ARCHITECTURE_OVERVIEW_V2_3.md](02_architecture/ARCHITECTURE_OVERVIEW_V2_3.md)** (30 min)
   - System architecture with C4 diagram
   - Component responsibilities
   - Data flow

5. **[docs/README.md](README.md)** (10 min)
   - Master documentation index
   - Bookmark this page!

### Day 5: Explore the Codebase

**Key directories to explore:**

```
cons/chatavg/
├── src/
│   ├── core/           # Core business logic
│   │   ├── providerEvents.js    # SPEC-001 implementation
│   │   ├── AgentRun.js          # Agent lifecycle
│   │   └── Mission.js           # Mission management
│   ├── workflows/      # Temporal workflows
│   │   └── agentWorkflow.js     # Main workflow orchestration
│   ├── routes/         # API endpoints
│   │   ├── chat.js              # Chat endpoints
│   │   └── missions.js          # Mission CRUD
│   ├── services/       # Business services
│   │   ├── adequacyEngine.js    # Claim extraction
│   │   ├── policyEngine.js      # Approval policies
│   │   └── sandboxManager.js    # E2B integration
│   └── models/         # Database models
│       └── sqlite.js            # SQLite schema & queries
├── tests/              # Test suites
└── public/             # Web UI (Vanilla JS)
```

**Exercise:** Trace a request through the system
1. User sends message in Web UI (`public/index.html`)
2. Request hits `/api/chat` endpoint (`src/routes/chat.js`)
3. Temporal workflow starts (`src/workflows/agentWorkflow.js`)
4. Model inference via LiteLLM (`src/services/modelGateway.js`)
5. Claims extracted (`src/services/adequacyEngine.js`)
6. Response returned to UI

---

## Week 2: Deep Dive

### Day 1-2: Understand Key Specifications

Read these critical SPECs based on your role:

**For Backend Engineers:**
- [SPEC-001: Canonical Provider Events](04_specs/SPEC-001-CANONICAL_PROVIDER_EVENTS.md)
- [SPEC-006: AgentRun State Machine](04_specs/SPEC-006-AGENT_RUN_STATE_MACHINE.md)
- [SPEC-009: Durable Runtime](04_specs/SPEC-009-DURABLE_RUNTIME.md)

**For Frontend Engineers:**
- [SPEC-004: Semantic Protocol](04_specs/SPEC-004-SEMANTIC_PROTOCOL.md)
- [SPEC-006: AgentRun State Machine](04_specs/SPEC-006-AGENT_RUN_STATE_MACHINE.md)

**For All Engineers:**
- [ADR-001: Temporal Durable Runtime](03_adr/ADR-001-temporal-durable-runtime.md)
- [ADR-002: LiteLLM Model Gateway](03_adr/ADR-002-litellm-model-gateway.md)
- [ADR-003: E2B Hybrid Sandbox](03_adr/ADR-003-e2b-hybrid-sandbox.md)
- [ADR-004: MCP Tool Gateway](03_adr/ADR-004-mcp-tool-gateway.md)

### Day 3-4: Run Tests & Understand Quality Gates

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit        # Unit tests
npm run test:contract    # API contract tests
npm run test:security    # Security checks
npm run test:sandbox     # Sandbox integration tests
npm run test:semantic    # Semantic protocol tests

# View test coverage
npm test -- --coverage
```

**Understand test structure:**
- `tests/unit/` - Isolated unit tests
- `tests/integration/` - Multi-component tests
- `tests/e2e/` - End-to-end scenarios
- `tests/fixtures/` - Test data and mocks

### Day 5: Documentation Quality Tools

Learn our Documentation-as-Code practices:

```bash
# Validate all documentation
npm run docs:validate

# Generate quality dashboard
npm run docs:dashboard

# Check metadata in specs
npm run docs:check-metadata

# Lint markdown files
npm run docs:lint
```

Read:
- [QUALITY_DASHBOARD.md](QUALITY_DASHBOARD.md) - Documentation metrics
- [.github/workflows/check-docs.yml](../.github/workflows/check-docs.yml) - CI validation

---

## Week 3: First Contributions

### Good First Issues

Look for issues labeled `good-first-issue` in the project tracker. Here are typical starter tasks:

**Documentation Tasks:**
- Add missing examples to SPEC documents
- Fix broken links in documentation
- Add Mermaid diagrams to architecture docs
- Improve error messages in API responses

**Code Tasks:**
- Add unit tests for existing functions
- Fix linting warnings
- Add input validation to API endpoints
- Improve error handling in workflows

### Your First PR Process

1. **Pick an issue** from the backlog or create one for improvement you noticed

2. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

3. **Make changes:**
   - Write code following existing patterns
   - Add/update tests
   - Update documentation if needed

4. **Test locally:**
   ```bash
   npm test
   npm run docs:validate
   ```

5. **Commit with conventional format:**
   ```bash
   git commit -m "feat: add validation to chat endpoint"
   # or
   git commit -m "fix: correct typo in SPEC-004"
   # or
   git commit -m "docs: add sequence diagram to SPEC-009"
   ```

6. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   # Then create PR via GitHub UI
   ```

7. **PR Review checklist:**
   - [ ] Tests pass (`npm test`)
   - [ ] Documentation updated (if applicable)
   - [ ] Code follows existing style
   - [ ] No console.log or debug statements
   - [ ] Commit message is clear

### Pair Programming Sessions

Schedule 1-hour sessions with team members:

- **Backend Architecture** - with Backend Lead
- **Frontend Patterns** - with Frontend Lead
- **Temporal Workflows** - with DevOps Engineer
- **Testing Strategy** - with QA Engineer

---

## Week 4: Ownership

### Choose Your Area

By week 4, you should start taking ownership of a subsystem:

**Backend Track:**
- Temporal workflow optimization
- Database query performance
- API endpoint design
- Security hardening

**Frontend Track:**
- Web UI component architecture
- Real-time updates (WebSocket/SSE)
- State management
- Accessibility improvements

**DevOps Track:**
- CI/CD pipeline improvements
- Monitoring and alerting
- Deployment automation
- Infrastructure as Code

**Quality Track:**
- Test coverage expansion
- Documentation quality
- Code review standards
- Release process

### Reading List by Track

**Backend Engineers:**
- [SPEC-009: Durable Runtime](04_specs/SPEC-009-DURABLE_RUNTIME.md)
- [SPEC-019: Sandbox Manager](04_specs/SPEC-019-SANDBOX_MANAGER.md)
- [TEMPORAL_DEVELOPER_GUIDE.md](06_development/TEMPORAL_DEVELOPER_GUIDE.md)

**Frontend Engineers:**
- [SPEC-006: AgentRun State Machine](04_specs/SPEC-006-AGENT_RUN_STATE_MACHINE.md)
- [UI_COMPONENT_GUIDE.md](06_development/UI_COMPONENT_GUIDE.md) *(create if missing)*

**DevOps Engineers:**
- [RUNBOOK_COMMON_ISSUES.md](09_ops/RUNBOOK_COMMON_ISSUES.md)
- [DEPLOYMENT_GUIDE.md](09_ops/DEPLOYMENT_GUIDE.md)
- [THREAT_MODEL.md](08_security/THREAT_MODEL.md)

---

## Good First Issues

### Documentation (Easy, 1-2 hours)

1. **Add code examples to SPEC-009**
   - File: `docs/04_specs/SPEC-009-DURABLE_RUNTIME.md`
   - Task: Add JavaScript example showing Temporal workflow usage
   - Skills: JavaScript, reading comprehension

2. **Fix broken internal links**
   - Run: `npm run docs:validate`
   - Fix any broken links reported
   - Skills: Attention to detail

3. **Add Mermaid diagram to SPEC-018**
   - File: `docs/04_specs/SPEC-018-MCP_TOOL_GATEWAY.md`
   - Task: Create sequence diagram for tool registration flow
   - Skills: Mermaid syntax, understanding of MCP

4. **Improve glossary terms**
   - File: `docs/01_product/GLOSSARY.md`
   - Task: Add 3-5 new terms you learned during onboarding
   - Skills: Clear writing

### Code (Medium, 4-8 hours)

5. **Add input validation to `/api/chat` endpoint**
   - File: `cons/chatavg/src/routes/chat.js`
   - Task: Validate message length, sanitize input
   - Skills: Express.js, security basics

6. **Improve error messages in AgentRun**
   - File: `cons/chatavg/src/core/AgentRun.js`
   - Task: Replace generic errors with specific, actionable messages
   - Skills: JavaScript, user empathy

7. **Add unit tests for AdequacyEngine**
   - File: `cons/chatavg/tests/unit/adequacyEngine.test.js`
   - Task: Write tests for claim extraction edge cases
   - Skills: Jest/Mocha, test writing

8. **Add rate limiting to API endpoints**
   - File: `cons/chatavg/src/middleware/rateLimiter.js` (new)
   - Task: Implement basic rate limiting middleware
   - Skills: Express middleware, Redis (optional)

### Testing (Medium, 4-6 hours)

9. **Add integration test for approval flow**
   - File: `cons/chatavg/tests/integration/approvalFlow.test.js`
   - Task: Test approve/reject scenarios
   - Skills: Async testing, Temporal mocking

10. **Add security test for SQL injection prevention**
    - File: `cons/chatavg/tests/security/sqlInjection.test.js`
    - Task: Verify parameterized queries prevent injection
    - Skills: Security testing, SQL

---

## FAQ

### General Questions

**Q: What's the current state of the project?**
A: We're in "Skeleton/MVP PoC" phase with "Hardening" in progress. Many features have working implementations but need production-ready polish. See [CURRENT_REALITY_AUDIT.md](../CURRENT_REALITY_AUDIT.md) for honest assessment.

**Q: How do I know if something is a mock or real implementation?**
A: Check for comments like `// TODO: Implement` or `// Mock for now`. Also see [PROJECT_BACKLOG.md](../PROJECT_BACKLOG.md) which marks items as "Skeleton", "Partial", or "Complete".

**Q: What's the most important thing to understand first?**
A: The **Semantic Protocol** (SPEC-004) and **AgentRun lifecycle** (SPEC-006). Everything else builds on these concepts.

**Q: Can I use TypeScript?**
A: Currently the codebase is plain JavaScript. TypeScript migration is planned but not started. Feel free to propose it as an RFC.

**Q: How do I add a new LLM provider?**
A: Use LiteLLM Proxy (ADR-002). Add provider config to LiteLLM, then update `modelGateway.js` to support new model names. Don't add direct API integrations.

### Development Questions

**Q: Tests are failing locally but pass in CI. Why?**
A: Common causes:
- Missing environment variables in `.env`
- Temporal dev server not running
- Port conflicts (3000, 3001 already in use)
- SQLite database locked from previous run

**Q: How do I debug Temporal workflows?**
A: Use Temporal Web UI (usually at `http://localhost:8080`). You can see workflow state, history, and replay failures. Also check logs in `cons/chatavg/logs/`.

**Q: Where are API keys stored?**
A: In `.env` files (gitignored). Never commit actual keys. Use `.env.example` as template. For CI, keys are in GitHub Secrets.

**Q: How do I reset the local database?**
A: Delete `cons/chatavg/data/chatavg.db` and restart the app. It will recreate the schema. Warning: This deletes all local data!

**Q: What browser should I use for testing?**
A: Chrome/Chromium recommended. The Web UI uses modern JS features that may not work in older browsers. Firefox generally works fine.

### Process Questions

**Q: How often should I commit?**
A: Small, frequent commits are better than large ones. Commit when you have a logical unit of work complete (e.g., "add validation function", "update error handler").

**Q: Who reviews my PRs?**
A: Depends on the area:
- Backend code → Backend Lead + one other backend engineer
- Frontend code → Frontend Lead
- DevOps/Infrastructure → DevOps Engineer
- Documentation → Any senior team member

**Q: What if I'm stuck for more than 30 minutes?**
A: Ask for help! Post in team chat with:
1. What you're trying to do
2. What you've tried
3. Error messages or unexpected behavior
4. Relevant code snippets

**Q: How do I track my progress?**
A: Update the issue/PR status in the project tracker. For onboarding, self-assess against the weekly goals in this guide.

---

## Contact List

### Team Roles & Responsibilities

| Role | Name | Slack | Responsible For |
|------|------|-------|-----------------|
| Tech Lead | [Name] | @techlead | Architecture decisions, technical strategy |
| Backend Lead | [Name] | @backend-lead | Backend code quality, API design |
| Frontend Lead | [Name] | @frontend-lead | UI/UX, frontend architecture |
| DevOps Engineer | [Name] | @devops | Infrastructure, CI/CD, deployments |
| QA Engineer | [Name] | @qa | Testing strategy, quality gates |
| Security Lead | [Name] | @security | Security reviews, threat modeling |
| Product Owner | [Name] | @product | Requirements, roadmap, priorities |

*Note: Update this table with actual names and contacts*

### Communication Channels

- **#chatavg-general** - General discussion, announcements
- **#chatavg-backend** - Backend development questions
- **#chatavg-frontend** - Frontend/UI discussions
- **#chatavg-devops** - Infrastructure, deployment issues
- **#chatavg-help** - Quick questions, pair programming requests
- **#chatavg-reviews** - PR review requests

### Office Hours

- **Tech Office Hours:** Tuesdays & Thursdays, 2-4 PM (for architectural questions)
- **Pair Programming:** Book slots via calendar invite
- **Weekly Standup:** Mondays 10 AM (progress updates)
- **Retrospective:** Fridays 4 PM (what went well, what to improve)

---

## Learning Resources

### Internal Resources

- **[ChatAVG Documentation Hub](README.md)** - Our master docs index
- **[Architecture Overview](02_architecture/ARCHITECTURE_OVERVIEW_V2_3.md)** - System design
- **[Sprint Reports](05_delivery/)** - Recent development history
- **[Risk Register](08_security/RISK_REGISTER.md)** - Known risks and mitigations

### External Resources

**Temporal.io:**
- [Temporal Docs](https://docs.temporal.io/)
- [Node.js SDK Guide](https://docs.temporal.io/dev-guide/nodejs)
- [Workflow Best Practices](https://docs.temporal.io/workflows)

**LiteLLM:**
- [LiteLLM Docs](https://docs.litellm.ai/)
- [Provider Integration Guide](https://docs.litellm.ai/docs/providers)

**MCP (Model Context Protocol):**
- [MCP Specification](https://modelcontextprotocol.io/introduction)
- [Building MCP Servers](https://modelcontextprotocol.io/quickstart/server)

**E2B Sandbox:**
- [E2B Docs](https://e2b.dev/docs)
- [Sandbox Examples](https://e2b.dev/docs/examples)

**Security:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

### Recommended Books

- "Designing Data-Intensive Applications" - Martin Kleppmann
- "Building Microservices" - Sam Newman
- "The Pragmatic Programmer" - David Thomas & Andrew Hunt
- "Clean Code" - Robert C. Martin

---

## Checklist: Am I Ready?

Before considering yourself "onboarded", ensure you can:

- [ ] Set up local development environment without help
- [ ] Run the application and all tests successfully
- [ ] Explain the Semantic Protocol to another developer
- [ ] Trace a request from UI through backend to database
- [ ] Create a PR following our conventions
- [ ] Identify which SPEC document covers a given feature
- [ ] Navigate the documentation efficiently using docs/README.md
- [ ] Know who to ask for help in each area

**Timeline:** Most developers complete onboarding in 3-4 weeks. Don't rush—focus on understanding, not just checking boxes.

---

## Feedback

This onboarding guide is a living document. If you found something unclear or missing:

1. Note it down during your onboarding
2. After week 4, submit a PR improving this guide
3. Share your experience in #chatavg-general

**Last updated:** 2026-05-19
**Next review:** 2026-06-19 (or after major onboarding feedback)

---

*Welcome aboard! 🚀*
