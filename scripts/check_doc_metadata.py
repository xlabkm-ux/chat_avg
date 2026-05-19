#!/usr/bin/env python3
"""
Check that documentation files have required metadata in frontmatter.

Usage:
    python check_doc_metadata.py <directory>

Required metadata for SPEC files:
    - id (e.g., SPEC-001)
    - title
    - version
    - owner
    - status (Draft|Active|Deprecated)
    - last_updated (YYYY-MM-DD)

Required metadata for ADR files:
    - id (e.g., ADR-001)
    - title
    - status (Proposed|Accepted|Rejected|Superseded)
    - version
    - owner
    - last_updated (YYYY-MM-DD)
"""

import sys
import os
import re
from pathlib import Path


def parse_frontmatter(content):
    """Extract YAML frontmatter from markdown content."""
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None

    frontmatter = {}
    lines = match.group(1).split('\n')
    for line in lines:
        if ':' in line:
            key, value = line.split(':', 1)
            frontmatter[key.strip()] = value.strip()

    return frontmatter


def check_spec_metadata(filepath, frontmatter):
    """Check metadata for SPEC files."""
    required_fields = ['id', 'title', 'version', 'owner', 'status', 'last_updated']
    errors = []

    for field in required_fields:
        if field not in frontmatter:
            errors.append(f"Missing required field: {field}")

    # Validate status values
    if 'status' in frontmatter:
        valid_statuses = ['Draft', 'Active', 'Deprecated', 'Superseded']
        if frontmatter['status'] not in valid_statuses:
            errors.append(f"Invalid status: {frontmatter['status']}. Must be one of {valid_statuses}")

    # Validate ID format
    if 'id' in frontmatter:
        if not re.match(r'^SPEC-\d{3}$', frontmatter['id']):
            errors.append(f"Invalid ID format: {frontmatter['id']}. Expected SPEC-XXX")

    # Validate date format
    if 'last_updated' in frontmatter:
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', frontmatter['last_updated']):
            errors.append(f"Invalid date format: {frontmatter['last_updated']}. Expected YYYY-MM-DD")

    return errors


def check_adr_metadata(filepath, frontmatter):
    """Check metadata for ADR files."""
    required_fields = ['id', 'title', 'status', 'version', 'owner', 'last_updated']
    errors = []

    for field in required_fields:
        if field not in frontmatter:
            errors.append(f"Missing required field: {field}")

    # Validate status values
    if 'status' in frontmatter:
        valid_statuses = ['Proposed', 'Accepted', 'Rejected', 'Superseded']
        if frontmatter['status'] not in valid_statuses:
            errors.append(f"Invalid status: {frontmatter['status']}. Must be one of {valid_statuses}")

    # Validate ID format
    if 'id' in frontmatter:
        if not re.match(r'^ADR-\d{3}$', frontmatter['id']):
            errors.append(f"Invalid ID format: {frontmatter['id']}. Expected ADR-XXX")

    # Validate date format
    if 'last_updated' in frontmatter:
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', frontmatter['last_updated']):
            errors.append(f"Invalid date format: {frontmatter['last_updated']}. Expected YYYY-MM-DD")

    return errors


def main():
    if len(sys.argv) != 2:
        print("Usage: python check_doc_metadata.py <directory>")
        sys.exit(1)

    directory = Path(sys.argv[1])
    if not directory.exists():
        print(f"Error: Directory {directory} does not exist")
        sys.exit(1)

    # Determine document type from directory name
    dir_name = directory.name
    if 'spec' in dir_name.lower():
        doc_type = 'SPEC'
        check_fn = check_spec_metadata
    elif 'adr' in dir_name.lower():
        doc_type = 'ADR'
        check_fn = check_adr_metadata
    else:
        print(f"Warning: Unknown document type for directory {dir_name}, using generic check")
        doc_type = 'GENERIC'
        check_fn = lambda f, m: []

    md_files = list(directory.glob('*.md'))
    if not md_files:
        print(f"No markdown files found in {directory}")
        sys.exit(0)

    total_errors = 0
    files_checked = 0
    files_with_errors = 0

    print(f"Checking {len(md_files)} {doc_type} files in {directory}...\n")

    for filepath in sorted(md_files):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        frontmatter = parse_frontmatter(content)

        if frontmatter is None:
            print(f"ERROR: {filepath.name} - No frontmatter found")
            total_errors += 1
            files_with_errors += 1
            continue

        errors = check_fn(filepath, frontmatter)

        if errors:
            print(f"ERRORS in {filepath.name}:")
            for error in errors:
                print(f"  - {error}")
            total_errors += len(errors)
            files_with_errors += 1
        else:
            files_checked += 1

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Files checked: {files_checked}/{len(md_files)}")
    print(f"  Files with errors: {files_with_errors}")
    print(f"  Total errors: {total_errors}")
    print(f"{'='*60}")

    if total_errors > 0:
        sys.exit(1)
    else:
        print("\nAll files have valid metadata!")
        sys.exit(0)


if __name__ == '__main__':
    main()
