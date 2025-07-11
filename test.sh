#!/bin/bash

echo "🧪 JsonBoard Test Suite"
echo "======================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Test $TESTS_RUN: $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}FAIL${NC}"
        echo "  Command: $test_command"
    fi
}

# Check if dist directory exists
run_test "CLI build exists" "test -f dist/index.js"

# Check if example data exists
run_test "Example data exists" "test -f examples/users.json"

# Check if data directory was created
run_test "Data directory exists" "test -d data"

# Start server in background for API tests
echo "Starting test server..."
node dist/index.js --dir=examples --port=3003 --no-open > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

# Test API endpoints
run_test "Server responds to /api/files" "curl -s http://localhost:3003/api/files | grep -q files"
run_test "Server loads specific file" "curl -s http://localhost:3003/api/files/users.json | grep -q filename"

# Test file writing (create a backup first)
cp examples/config.json examples/config.json.backup
run_test "Server saves file changes" "curl -X PUT -s -H 'Content-Type: application/json' -d '{\"data\":{\"test\":\"api\"}}' http://localhost:3003/api/files/config.json | grep -q success"

# Restore backup
mv examples/config.json.backup examples/config.json

# Clean up
kill $SERVER_PID > /dev/null 2>&1
sleep 1

# Results
echo
echo "======================="
echo "Test Results: $TESTS_PASSED/$TESTS_RUN tests passed"

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "${GREEN}✅ All tests passed! JsonBoard is ready for publishing.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the issues above.${NC}"
    exit 1
fi
