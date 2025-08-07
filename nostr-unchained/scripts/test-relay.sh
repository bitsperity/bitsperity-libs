#!/bin/bash

# Test Relay Management Script
# Startet/stoppt ephemeral Container-Relay für Tests

set -e

COMPOSE_FILE="docker-compose.test.yml"
RELAY_URL="ws://localhost:7777"
HEALTH_URL="http://localhost:7777"

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

wait_for_relay() {
    echo "⏳ Waiting for relay to be ready..."
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s "$HEALTH_URL" >/dev/null 2>&1; then
            echo "✅ Relay is ready at $RELAY_URL"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo "   Attempt $attempt/$max_attempts..."
        sleep 1
    done
    
    echo "❌ Relay failed to start within $max_attempts seconds"
    docker-compose -f "$COMPOSE_FILE" logs nostr-relay
    return 1
}

start_relay() {
    echo "🚀 Starting ephemeral test relay..."
    
    # Cleanup alte Container
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans >/dev/null 2>&1 || true
    
    # Starte neuen Container
    docker-compose -f "$COMPOSE_FILE" up -d nostr-relay
    
    # Warte bis Ready
    if wait_for_relay; then
        echo "🎯 Test relay running at: $RELAY_URL"
        echo "💾 Database: In-Memory (ephemeral)"
        echo "🧪 Ready for tests!"
    else
        echo "❌ Failed to start relay"
        stop_relay
        exit 1
    fi
}

stop_relay() {
    echo "🛑 Stopping test relay..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    echo "✅ Test relay stopped"
}

status_relay() {
    if docker-compose -f "$COMPOSE_FILE" ps nostr-relay | grep -q "Up"; then
        echo "✅ Test relay is running at $RELAY_URL"
        
        # Test Verbindung
        if curl -f -s "$HEALTH_URL" >/dev/null 2>&1; then
            echo "🔗 Relay is healthy and responding"
        else
            echo "⚠️  Relay is running but not responding"
        fi
    else
        echo "❌ Test relay is not running"
    fi
}

logs_relay() {
    docker-compose -f "$COMPOSE_FILE" logs -f nostr-relay
}

case "$1" in
    start)
        start_relay
        ;;
    stop)
        stop_relay
        ;;
    restart)
        stop_relay
        sleep 2
        start_relay
        ;;
    status)
        status_relay
        ;;
    logs)
        logs_relay
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start ephemeral test relay"
        echo "  stop    - Stop test relay"
        echo "  restart - Restart test relay"
        echo "  status  - Check relay status"
        echo "  logs    - Show relay logs"
        echo ""
        echo "Relay URL: $RELAY_URL"
        exit 1
        ;;
esac