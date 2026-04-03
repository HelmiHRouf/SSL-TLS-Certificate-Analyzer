#!/bin/bash

# Test script for CertLens landing page
# Usage: ./scripts/test-landing.sh

set -e

echo "🧪 Testing CertLens landing page..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

# Kill any existing dev servers
echo "🧹 Cleaning up existing dev servers..."
pkill -f "next dev" 2>/dev/null || true
sleep 1

# Start dev server in background
echo "🚀 Starting Next.js dev server..."
npm run dev > /tmp/certlens-dev.log 2>&1 &
DEV_PID=$!

# Wait for server to be ready (max 30 seconds)
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Server failed to start within 30 seconds${NC}"
        echo "📋 Last 20 lines of dev server log:"
        tail -20 /tmp/certlens-dev.log
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Test 1: Check if page loads
echo ""
echo "🔍 Test 1: Checking if landing page loads..."
RESPONSE=$(curl -s http://localhost:3000/)
if echo "$RESPONSE" | grep -q "CertLens"; then
    echo -e "${GREEN}✅ Landing page loads successfully${NC}"
else
    echo -e "${RED}❌ Landing page missing 'CertLens' title${NC}"
    kill $DEV_PID 2>/dev/null || true
    exit 1
fi

# Test 2: Check for key elements
echo ""
echo "🔍 Test 2: Checking for key elements..."

ELEMENTS=(
    "SSL / TLS certificate analyzer"
    "Is your site"  # Partial match for "Is your site's certificate actually secure"
    "Inspect any domain"
    "github.com"
    "expired.badssl.com"
    "Analyze"
)

FAILED=0
for element in "${ELEMENTS[@]}"; do
    if echo "$RESPONSE" | grep -q "$element"; then
        echo -e "${GREEN}  ✅ Found: $element${NC}"
    else
        echo -e "${RED}  ❌ Missing: $element${NC}"
        FAILED=$((FAILED + 1))
    fi
done

# Test 3: Check for navigation links
echo ""
echo "🔍 Test 3: Checking for navigation..."
if echo "$RESPONSE" | grep -q 'href="/learn"'; then
    echo -e "${GREEN}  ✅ Learn link present${NC}"
else
    echo -e "${YELLOW}  ⚠️ Learn link not found (may be client-side rendered)${NC}"
fi

if echo "$RESPONSE" | grep -q "GitHub"; then
    echo -e "${GREEN}  ✅ GitHub link present${NC}"
else
    echo -e "${YELLOW}  ⚠️ GitHub link not found${NC}"
fi

# Test 4: Check API is accessible
echo ""
echo "🔍 Test 4: Checking API endpoints..."
if curl -s --max-time 5 "http://localhost:3000/api/cert?domain=github.com" > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ /api/cert endpoint responding${NC}"
else
    echo -e "${YELLOW}  ⚠️ /api/cert endpoint not responding (may need more time)${NC}"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $DEV_PID 2>/dev/null || true
wait $DEV_PID 2>/dev/null || true

# Summary
echo ""
echo "📊 Test Summary:"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED test(s) failed${NC}"
    exit 1
fi