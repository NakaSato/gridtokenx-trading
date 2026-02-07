#!/bin/bash

##############################################################################
# Energy Token Trading E2E Test Runner
# 
# This script runs the complete end-to-end tests for the GridTokenX energy
# token trading platform. It ensures all services are running and ready
# before executing the test suite.
##############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=30
TRADING_UI_URL="${UI_URL:-http://localhost:3000}"
API_GATEWAY_URL="${API_URL:-http://localhost:4000}"

# Functions
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Check if service is running
check_service() {
    local url=$1
    local service_name=$2
    local retries=0

    print_info "Checking ${service_name}..."

    while [ $retries -lt $TIMEOUT ]; do
        if curl -s -f "$url/health" > /dev/null 2>&1 || curl -s -f "$url" > /dev/null 2>&1; then
            print_success "${service_name} is running at ${url}"
            return 0
        fi
        retries=$((retries + 1))
        sleep 1
    done

    print_error "${service_name} is not responding at ${url}"
    return 1
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   GridTokenX Energy Token Trading - E2E Test Runner      ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Check if required services are running
    print_info "Verifying service dependencies..."
    echo ""

    if ! check_service "$TRADING_UI_URL" "Trading UI (Port 3000)"; then
        print_warning "Starting development environment..."
        # Attempt to start services if not running
        # This assumes you're in the gridtokenx-trading directory
        npm run dev &
        DEV_PID=$!
        sleep 10
    fi

    if ! check_service "$API_GATEWAY_URL" "API Gateway (Port 4000)"; then
        print_error "API Gateway is required but not running"
        print_info "Please start it with: cd gridtokenx-apigateway && cargo run"
        exit 1
    fi

    echo ""
    print_success "All services are running!"
    echo ""

    # Run the tests
    print_info "Starting E2E tests..."
    echo ""

    # Run specific test suites
    if [ "$1" == "complete" ] || [ -z "$1" ]; then
        print_info "Running complete energy token trading flow test..."
        npx playwright test tests/e2e/complete-trading-flow.spec.ts --reporter=html
    elif [ "$1" == "all" ]; then
        print_info "Running all E2E tests..."
        npx playwright test tests/e2e/ --reporter=html
    elif [ "$1" == "quick" ]; then
        print_info "Running quick sanity checks..."
        npx playwright test tests/e2e/p2p.spec.ts tests/e2e/auth.spec.ts --reporter=html
    else
        print_info "Running: $1"
        npx playwright test "$1" --reporter=html
    fi

    TEST_EXIT_CODE=$?

    echo ""
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        print_success "All tests passed!"
    else
        print_error "Some tests failed. Check the HTML report in: playwright-report/"
    fi

    # Cleanup
    if [ ! -z "$DEV_PID" ]; then
        print_info "Stopping development environment..."
        kill $DEV_PID 2>/dev/null || true
    fi

    exit $TEST_EXIT_CODE
}

# Display usage
show_usage() {
    cat << EOF
Usage: ./run-e2e-tests.sh [option]

Options:
    complete    Run the complete end-to-end energy token trading flow (default)
    all         Run all E2E test suites
    quick       Run quick sanity checks only
    <file>      Run a specific test file (e.g., tests/e2e/auth.spec.ts)
    help        Show this help message

Examples:
    ./run-e2e-tests.sh              # Run complete flow test
    ./run-e2e-tests.sh all          # Run all tests
    ./run-e2e-tests.sh quick        # Run quick checks
    
Environment Variables:
    UI_URL      Trading UI base URL (default: http://localhost:3000)
    API_URL     API Gateway base URL (default: http://localhost:4000)

Prerequisites:
    - Trading UI must be running (port 3000)
    - API Gateway must be running (port 4000)
    - Solana test validator or devnet connection configured

Test Results:
    HTML reports are generated in the 'playwright-report/' directory
    Open 'playwright-report/index.html' in your browser to view detailed results

EOF
}

# Check for help flag
if [ "$1" == "help" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    show_usage
    exit 0
fi

# Run main function
main "$@"
