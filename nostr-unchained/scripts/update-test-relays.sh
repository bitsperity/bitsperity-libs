#!/bin/bash

# Script to update all test files to use container relay
# Replaces hardcoded relay URLs with localhost:7777 (container relay)

set -e

CONTAINER_RELAY_URL="ws://localhost:7777"

echo "🔄 Updating all test files to use container relay: $CONTAINER_RELAY_URL"

# Find all test files and replace relay URLs
find tests/ -name "*.test.ts" -type f | while read -r file; do
    # Skip backup files
    if [[ "$file" == *.bak ]]; then
        continue
    fi
    
    # Check if file contains relay URLs
    if grep -q "ws://umbrel.local:4848\|ws://127.0.0.1\|wss://relay.damus.io\|wss://nos.lol" "$file"; then
        echo "📝 Updating: $file"
        
        # Create backup
        cp "$file" "$file.bak"
        
        # Replace all common relay URLs with container relay
        sed -i "s|ws://umbrel.local:4848|$CONTAINER_RELAY_URL|g" "$file"
        sed -i "s|ws://127.0.0.1:9999|$CONTAINER_RELAY_URL|g" "$file"
        sed -i "s|ws://127.0.0.1:7777|$CONTAINER_RELAY_URL|g" "$file"
        
        # For multi-relay tests, keep container relay as primary and remove problematic ones
        sed -i "s|wss://relay.damus.io|$CONTAINER_RELAY_URL|g" "$file"
        sed -i "s|wss://nos.lol|$CONTAINER_RELAY_URL|g" "$file"
        
        echo "   ✅ Updated relay URLs in $file"
    fi
done

echo ""
echo "🎯 Summary of changes:"
echo "   Container Relay: $CONTAINER_RELAY_URL"
echo "   All test files now use ephemeral container relay"
echo "   Backup files created with .bak extension"
echo ""
echo "💡 To restore original files:"
echo "   find tests/ -name '*.bak' | sed 's/.bak$//' | xargs -I {} mv {}.bak {}"
echo ""
echo "✅ Test relay update completed!"