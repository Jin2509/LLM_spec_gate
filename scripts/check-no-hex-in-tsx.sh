#!/bin/bash
# Verify no hardcoded HEX colors exist in any .tsx component files.
echo "Checking for hardcoded hex colors in .tsx files..."
MATCHES=$(grep -rnE "#[0-9a-fA-F]{3,8}" src/ --include="*.tsx" || true)

if [ -n "$MATCHES" ]; then
  echo "❌ Error: Found hardcoded hex colors in .tsx files:"
  echo "$MATCHES"
  exit 1
else
  echo "✅ No hardcoded hex colors found in .tsx files."
  exit 0
fi
