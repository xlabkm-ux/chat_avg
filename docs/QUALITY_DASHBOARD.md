# Documentation Quality Dashboard

This dashboard provides automated metrics and quality checks for the ChatAVG documentation.

## Quick Start

### Generate Dashboard Locally

```bash
# Generate dashboard report
python scripts/generate_quality_dashboard.py docs/ > docs/QUALITY_REPORT.md

# Check metadata in SPEC files
python scripts/check_doc_metadata.py docs/04_specs/

# Check metadata in ADR files
python scripts/check_doc_metadata.py docs/03_adr/
```

### Run All Checks

```bash
# Install dependencies
pip install pyyaml

# Run all validation checks
./scripts/validate_docs.sh
```

## Automated Checks (CI)

All documentation changes are automatically validated via GitHub Actions:

- **Link Checking**: Validates all markdown links are not broken
- **Formatting**: Ensures consistent markdown style via markdownlint
- **Metadata Validation**: Checks required frontmatter in SPEC/ADR files
- **Diagram Validation**: Verifies Mermaid syntax is correct

See [.github/workflows/check-docs.yml](../.github/workflows/check-docs.yml) for configuration.

## Current Metrics

*Run `python scripts/generate_quality_dashboard.py docs/` to update*

### Document Distribution

| Type | Count | Status |
|------|-------|--------|
| SPEC Files | TBD | Check metadata completeness |
| ADR Files | 5 | ✅ All complete |
| Architecture | TBD | Review diagram coverage |
| Sprint Reports | TBD | Verify consistency |

### Quality Goals

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Empty documents | 0 | TBD | ⏳ |
| Documents with metadata | 100% | TBD | ⏳ |
| Mermaid diagrams | 20+ | 5 | 🟡 In Progress |
| Cross-references per doc | 3+ | TBD | ⏳ |

## Documentation Standards

### Required Frontmatter for SPEC Files

```yaml
---
id: SPEC-XXX
title: Short descriptive title
version: 1.0
owner: Team or person responsible
status: Draft | Active | Deprecated | Superseded
last_updated: YYYY-MM-DD
reviewers: List of reviewers
related: Links to related documents
---
```

### Required Frontmatter for ADR Files

```yaml
---
id: ADR-XXX
title: Decision title
status: Proposed | Accepted | Rejected | Superseded
version: 1.0
owner: Decision owner
last_updated: YYYY-MM-DD
---
```

## Improvement Roadmap

### Phase 1: Metadata Completion (Sprint F4)
- Add frontmatter to all SPEC files
- Add frontmatter to all ADR files
- Validate existing metadata accuracy

### Phase 2: Diagram Coverage (Sprint F4-F5)
- Add Mermaid diagrams to critical specs
- Ensure architecture docs have visual representations
- Create sequence diagrams for complex workflows

### Phase 3: Cross-Reference Enhancement (Sprint F5)
- Add related document links
- Create bidirectional references
- Build documentation dependency graph

### Phase 4: Automation (Sprint F6)
- Auto-generate API documentation from code
- Implement documentation change detection
- Set up documentation review reminders

## Tools & Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `check_doc_metadata.py` | Validate frontmatter | `python scripts/check_doc_metadata.py docs/04_specs/` |
| `generate_quality_dashboard.py` | Generate metrics | `python scripts/generate_quality_dashboard.py docs/` |
| `.github/workflows/check-docs.yml` | CI validation | Runs on PR/push |

## Contributing

When adding new documentation:

1. Use templates from `docs/templates/`
2. Include complete frontmatter metadata
3. Add at least one Mermaid diagram for complex concepts
4. Link to related documents
5. Run validation scripts before committing

---

*Last generated: Run `python scripts/generate_quality_dashboard.py docs/` to refresh*
