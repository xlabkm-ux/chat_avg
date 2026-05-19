# Documentation Templates

This directory contains standardized templates for ChatAVG documentation.

## Available Templates

### 1. [SPEC_TEMPLATE.md](SPEC_TEMPLATE.md)

**Use for:** Technical specifications, API definitions, data schemas

**When to use:**
- Defining new API endpoints
- Documenting data models and schemas
- Specifying protocol implementations
- Describing system behavior

**Key sections:**
- Frontmatter metadata (required)
- Overview and Motivation
- Schema/API specification
- Request/Response examples
- Implementation notes
- Testing requirements
- Migration guide (if breaking changes)

**Example usage:**
```bash
cp docs/templates/SPEC_TEMPLATE.md docs/04_specs/SPEC-XXX-YOUR_TITLE.md
# Then edit the file, replacing placeholders with your content
```

---

### 2. [ADR_TEMPLATE.md](ADR_TEMPLATE.md)

**Use for:** Architectural Decision Records

**When to use:**
- Making significant technical decisions
- Choosing between alternative approaches
- Documenting trade-offs and rationale
- Recording technology selections

**Key sections:**
- Context (problem statement)
- Decision (what was chosen)
- Consequences (positive and negative)
- Alternatives considered
- Validation plan

**Example usage:**
```bash
cp docs/templates/ADR_TEMPLATE.md docs/03_adr/ADR-XXX-your-decision.md
# Then edit the file, replacing placeholders with your content
```

**Decision process:**
1. Identify decision to be made
2. Draft ADR using template
3. Share with team for review
4. Discuss in architecture meeting
5. Update status to "Accepted" or "Rejected"
6. Link to related SPECs and code

---

### 3. [RUNBOOK_TEMPLATE.md](RUNBOOK_TEMPLATE.md)

**Use for:** Operational procedures and incident response

**When to use:**
- Documenting how to handle common issues
- Creating step-by-step troubleshooting guides
- Defining escalation procedures
- Recording operational best practices

**Key sections:**
- When to use (triggers)
- Symptoms (how to identify)
- Diagnosis (step-by-step)
- Resolution (immediate and long-term)
- Verification (confirm fix)
- Escalation (when and who)

**Example usage:**
```bash
cp docs/templates/RUNBOOK_TEMPLATE.md docs/09_ops/RUNBOOK-XXX-your-issue.md
# Then edit the file, replacing placeholders with your content
```

**Testing runbooks:**
- Test each runbook quarterly
- Verify all commands work as expected
- Update any outdated information
- Record test results in frontmatter

---

### 4. [POSTMORTEM_TEMPLATE.md](POSTMORTEM_TEMPLATE.md)

**Use for:** Incident post-mortems and retrospectives

**When to use:**
- After P0/P1 incidents
- After significant service disruptions
- When lessons can be learned
- To track improvement actions

**Key sections:**
- Executive summary
- Impact assessment
- Timeline of events
- Root cause analysis (5 Whys)
- Lessons learned
- Action items
- Prevention measures

**Example usage:**
```bash
cp docs/templates/POSTMORTEM_TEMPLATE.md docs/09_ops/POSTMORTEM-XXX-YYYY-MM-DD.md
# Then edit the file, replacing placeholders with your content
```

**Post-mortem process:**
1. Complete within 48 hours of incident resolution
2. Schedule review meeting with team
3. Focus on systemic issues, not blame
4. Create actionable improvement items
5. Track action items to completion
6. Share learnings with broader team

---

## Template Usage Guidelines

### Frontmatter Metadata

All templates include YAML frontmatter with required metadata. This enables:

- **Automated validation** via CI checks
- **Search and filtering** in documentation tools
- **Quality metrics** tracking
- **Cross-referencing** between documents

**Required fields vary by type:**

| Field | SPEC | ADR | RUNBOOK | POSTMORTEM |
|-------|------|-----|---------|------------|
| id | ✓ | ✓ | ✓ | ✓ |
| title | ✓ | ✓ | ✓ | ✓ |
| version | ✓ | ✓ | - | - |
| owner | ✓ | ✓ | ✓ | - |
| status | ✓ | ✓ | - | ✓ |
| last_updated | ✓ | ✓ | ✓ | - |
| severity | - | - | ✓ | ✓ |

### Writing Style

**Be concise:** Use short sentences and paragraphs. Aim for clarity over completeness.

**Use examples:** Include code snippets, command examples, and screenshots where helpful.

**Link generously:** Cross-reference related documents using relative links.

**Keep it current:** Update documents when underlying systems change.

**Avoid duplication:** If information exists elsewhere, link to it rather than copying.

### Version Control

- Commit documentation changes alongside related code changes
- Use meaningful commit messages: `docs: add SPEC-010 for knowledge gateway`
- Tag major documentation updates with version numbers
- Review old documents quarterly for accuracy

### Review Process

**For new documents:**
1. Draft using appropriate template
2. Self-review against checklist
3. Request review from domain expert
4. Address feedback
5. Merge to main branch

**For existing documents:**
1. Check last_updated date
2. Verify all information is current
3. Update examples if APIs changed
4. Add changelog entry
5. Update last_updated date

---

## Quality Checklist

Before submitting a document for review:

- [ ] Used correct template for document type
- [ ] All frontmatter fields completed
- [ ] No placeholder text remaining (e.g., `[Name]`, `[Date]`)
- [ ] All code examples are tested and working
- [ ] Links to other documents are valid
- [ ] Mermaid diagrams render correctly
- [ ] Spelling and grammar checked
- [ ] Document follows style guide
- [ ] Related documents are linked
- [ ] Changelog updated (if applicable)

---

## Contributing

If you find a template needs improvement:

1. Open an issue describing the problem
2. Propose specific changes
3. Get feedback from team
4. Update template
5. Notify team of changes

**Template maintenance:** Reviewed quarterly during documentation audit.

---

*Last updated: 2026-05-19*
*Next review: 2026-06-19*
