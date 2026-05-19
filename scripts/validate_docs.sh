#!/bin/bash
# validate_docs.sh - Run all documentation validation checks
# Usage: ./scripts/validate_docs.sh

set -e

echo "=========================================="
echo "ChatAVG Documentation Validation Suite"
echo "=========================================="
echo ""

DOCS_DIR="docs"
SCRIPTS_DIR="scripts"

# Check if docs directory exists
if [ ! -d "$DOCS_DIR" ]; then
    echo "ERROR: Docs directory not found at $DOCS_DIR"
    exit 1
fi

# 1. Check for empty files
echo "1. Checking for empty/placeholder files..."
EMPTY_COUNT=0
while IFS= read -r file; do
    WORD_COUNT=$(wc -w < "$file")
    if [ "$WORD_COUNT" -lt 50 ]; then
        echo "   WARNING: $file has only $WORD_COUNT words"
        EMPTY_COUNT=$((EMPTY_COUNT + 1))
    fi
done < <(find "$DOCS_DIR" -name "*.md" -type f)

if [ "$EMPTY_COUNT" -eq 0 ]; then
    echo "   ✅ No empty files found"
else
    echo "   ⚠️  Found $EMPTY_COUNT files with minimal content"
fi
echo ""

# 2. Check metadata in SPEC files
echo "2. Checking SPEC file metadata..."
if command -v python3 &> /dev/null; then
    python3 "$SCRIPTS_DIR/check_doc_metadata.py" "$DOCS_DIR/04_specs/" || true
else
    echo "   ⚠️  Python3 not available, skipping metadata check"
fi
echo ""

# 3. Check metadata in ADR files
echo "3. Checking ADR file metadata..."
if command -v python3 &> /dev/null; then
    python3 "$SCRIPTS_DIR/check_doc_metadata.py" "$DOCS_DIR/03_adr/" || true
else
    echo "   ⚠️  Python3 not available, skipping metadata check"
fi
echo ""

# 4. Count Mermaid diagrams
echo "4. Counting Mermaid diagrams..."
DIAGRAM_COUNT=0
FILES_WITH_DIAGRAMS=0
while IFS= read -r file; do
    COUNT=$(grep -c '```mermaid' "$file" || true)
    if [ "$COUNT" -gt 0 ]; then
        DIAGRAM_COUNT=$((DIAGRAM_COUNT + COUNT))
        FILES_WITH_DIAGRAMS=$((FILES_WITH_DIAGRAMS + 1))
    fi
done < <(find "$DOCS_DIR" -name "*.md" -type f)

echo "   📊 Found $DIAGRAM_COUNT diagrams in $FILES_WITH_DIAGRAMS files"
echo ""

# 5. Check for broken internal links (basic check)
echo "5. Checking for potential broken links..."
BROKEN_LINKS=0
while IFS= read -r file; do
    # Extract markdown links to .md files
    grep -oP '\[([^\]]+)\]\(([^\)]+\.md)' "$file" | while read -r link; do
        TARGET=$(echo "$link" | grep -oP '\([^\)]+\)' | tr -d '()')
        # Resolve relative path
        FILE_DIR=$(dirname "$file")
        FULL_PATH="$FILE_DIR/$TARGET"

        if [ ! -f "$FULL_PATH" ]; then
            echo "   WARNING: Link '$TARGET' in $file may be broken"
            BROKEN_LINKS=$((BROKEN_LINKS + 1))
        fi
    done
done < <(find "$DOCS_DIR" -name "*.md" -type f)

if [ "$BROKEN_LINKS" -eq 0 ]; then
    echo "   ✅ No broken internal links detected"
else
    echo "   ⚠️  Found $BROKEN_LINKS potentially broken links"
fi
echo ""

# 6. Generate quality report
echo "6. Generating quality dashboard..."
if command -v python3 &> /dev/null; then
    python3 "$SCRIPTS_DIR/generate_quality_dashboard.py" "$DOCS_DIR" > "$DOCS_DIR/QUALITY_REPORT.md"
    echo "   ✅ Dashboard generated at docs/QUALITY_REPORT.md"
else
    echo "   ⚠️  Python3 not available, skipping dashboard generation"
fi
echo ""

# Summary
echo "=========================================="
echo "Validation Complete"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Empty files: $EMPTY_COUNT"
echo "  - Mermaid diagrams: $DIAGRAM_COUNT in $FILES_WITH_DIAGRAMS files"
echo "  - Potentially broken links: $BROKEN_LINKS"
echo ""
echo "Next steps:"
echo "  - Review warnings above"
echo "  - Check docs/QUALITY_REPORT.md for detailed metrics"
echo "  - Fix any broken links or missing metadata"
echo ""
