#!/usr/bin/env python3
"""
Generate Documentation Quality Dashboard.

Scans the docs/ directory and generates metrics about:
- Total document count by type
- Documents with/without metadata
- Empty documents
- Documents with Mermaid diagrams
- Last updated timestamps
- Cross-references between documents

Usage:
    python generate_quality_dashboard.py <docs_directory> > docs/QUALITY_DASHBOARD.md
"""

import sys
import os
import re
from pathlib import Path
from datetime import datetime, timedelta


def scan_documents(docs_dir):
    """Scan all markdown files in docs directory."""
    docs_path = Path(docs_dir)

    stats = {
        'total_files': 0,
        'by_type': {},
        'with_metadata': 0,
        'without_metadata': 0,
        'empty_files': [],
        'with_mermaid': [],
        'last_updated': [],
        'cross_references': {}
    }

    for md_file in docs_path.rglob('*.md'):
        stats['total_files'] += 1

        # Determine type from path
        relative_path = md_file.relative_to(docs_path)
        parts = relative_path.parts

        if len(parts) > 1:
            doc_type = parts[0]
            stats['by_type'][doc_type] = stats['by_type'].get(doc_type, 0) + 1

        # Read file content
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Check if empty or placeholder
            if len(content.strip()) < 50:
                stats['empty_files'].append(str(relative_path))

            # Check for frontmatter
            has_frontmatter = bool(re.match(r'^---\n.*?\n---', content, re.DOTALL))
            if has_frontmatter:
                stats['with_metadata'] += 1
            else:
                stats['without_metadata'] += 1

            # Check for Mermaid diagrams
            if '```mermaid' in content:
                mermaid_count = content.count('```mermaid')
                stats['with_mermaid'].append((str(relative_path), mermaid_count))

            # Extract last_updated if present
            match = re.search(r'last_updated:\s*(\d{4}-\d{2}-\d{2})', content)
            if match:
                stats['last_updated'].append((str(relative_path), match.group(1)))

            # Count cross-references (links to other .md files)
            md_links = re.findall(r'\[([^\]]+)\]\(([^\)]+\.md)', content)
            if md_links:
                stats['cross_references'][str(relative_path)] = len(md_links)

        except Exception as e:
            print(f"Warning: Could not read {md_file}: {e}", file=sys.stderr)

    return stats


def generate_dashboard(stats):
    """Generate markdown dashboard from stats."""
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    dashboard = f"""# Documentation Quality Dashboard

**Last Updated:** {now}

---

## Overview Metrics

| Metric | Value |
|--------|-------|
| Total Documents | {stats['total_files']} |
| With Metadata | {stats['with_metadata']} ({stats['with_metadata']/max(stats['total_files'],1)*100:.1f}%) |
| Without Metadata | {stats['without_metadata']} ({stats['without_metadata']/max(stats['total_files'],1)*100:.1f}%) |
| Empty/Placeholder Files | {len(stats['empty_files'])} |
| Files with Mermaid Diagrams | {len(stats['with_mermaid'])} |
| Total Mermaid Diagrams | {sum(count for _, count in stats['with_mermaid'])} |

---

## Documents by Type

| Type | Count |
|------|-------|
"""

    for doc_type, count in sorted(stats['by_type'].items()):
        dashboard += f"| {doc_type} | {count} |\n"

    dashboard += "\n---\n\n"

    # Empty files warning
    if stats['empty_files']:
        dashboard += "## ⚠️ Empty/Placeholder Files\n\n"
        dashboard += "These files need content:\n\n"
        for filepath in sorted(stats['empty_files']):
            dashboard += f"- `{filepath}`\n"
        dashboard += "\n---\n\n"

    # Files with Mermaid diagrams
    if stats['with_mermaid']:
        dashboard += "## 📊 Files with Mermaid Diagrams\n\n"
        dashboard += "| File | Diagrams |\n"
        dashboard += "|------|----------|\n"
        for filepath, count in sorted(stats['with_mermaid'], key=lambda x: x[1], reverse=True):
            dashboard += f"| `{filepath}` | {count} |\n"
        dashboard += "\n---\n\n"

    # Recently updated files (last 30 days)
    recent_cutoff = datetime.now() - timedelta(days=30)
    recent_files = []
    old_files = []

    for filepath, date_str in stats['last_updated']:
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d')
            if date >= recent_cutoff:
                recent_files.append((filepath, date_str))
            else:
                old_files.append((filepath, date_str))
        except ValueError:
            pass

    if recent_files:
        dashboard += "## ✅ Recently Updated (Last 30 Days)\n\n"
        dashboard += "| File | Last Updated |\n"
        dashboard += "|------|-------------|\n"
        for filepath, date_str in sorted(recent_files, key=lambda x: x[1], reverse=True):
            dashboard += f"| `{filepath}` | {date_str} |\n"
        dashboard += "\n---\n\n"

    # Files needing updates (older than 90 days)
    very_old_cutoff = datetime.now() - timedelta(days=90)
    very_old_files = [
        (fp, ds) for fp, ds in old_files
        if datetime.strptime(ds, '%Y-%m-%d') < very_old_cutoff
    ]

    if very_old_files:
        dashboard += "## ⚠️ Files Needing Updates (>90 days old)\n\n"
        dashboard += "| File | Last Updated |\n"
        dashboard += "|------|-------------|\n"
        for filepath, date_str in sorted(very_old_files, key=lambda x: x[1]):
            dashboard += f"| `{filepath}` | {date_str} |\n"
        dashboard += "\n---\n\n"

    # Cross-reference analysis
    if stats['cross_references']:
        avg_refs = sum(stats['cross_references'].values()) / len(stats['cross_references'])
        dashboard += "## 🔗 Cross-Reference Analysis\n\n"
        dashboard += f"**Average references per document:** {avg_refs:.1f}\n\n"

        top_referenced = sorted(stats['cross_references'].items(), key=lambda x: x[1], reverse=True)[:10]
        dashboard += "**Top 10 most linked documents:**\n\n"
        dashboard += "| File | Outgoing Links |\n"
        dashboard += "|------|---------------|\n"
        for filepath, count in top_referenced:
            dashboard += f"| `{filepath}` | {count} |\n"
        dashboard += "\n---\n\n"

    # Quality checklist
    dashboard += """## Quality Checklist

### Current Sprint Goals
- [ ] All SPEC files have complete metadata
- [ ] All ADR files have complete metadata
- [ ] No empty/placeholder files
- [ ] Every major architecture doc has at least 1 Mermaid diagram
- [ ] Average cross-references per document > 3

### Automated Checks
- [ ] Markdown link checking passes
- [ ] Markdown linting passes
- [ ] Metadata validation passes
- [ ] Mermaid syntax validation passes

---

*Generated automatically by `scripts/generate_quality_dashboard.py`*
"""

    return dashboard


def main():
    if len(sys.argv) != 2:
        print("Usage: python generate_quality_dashboard.py <docs_directory>")
        sys.exit(1)

    docs_dir = sys.argv[1]
    if not os.path.exists(docs_dir):
        print(f"Error: Directory {docs_dir} does not exist")
        sys.exit(1)

    stats = scan_documents(docs_dir)
    dashboard = generate_dashboard(stats)
    print(dashboard)


if __name__ == '__main__':
    main()
