#!/bin/bash

# CareSyncVision - Pre-GitHub Push Verification Script
# Run this to verify everything is ready for open source publication

set -e

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "CareSyncVision - Open Source Verification Checklist"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} MISSING: $1"
        return 1
    fi
}

check_no_file() {
    if [ ! -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} FOUND (should not exist): $1"
        return 1
    fi
}

PASSED=0
FAILED=0

echo "📄 CHECKING CRITICAL FILES..."
echo ""

# Security files
check_file "SECURITY.md" "Security policy exists" && ((PASSED++)) || ((FAILED++))
check_file "CONTRIBUTING.md" "Contributing guide exists" && ((PASSED++)) || ((FAILED++))
check_file "CODE_OF_CONDUCT.md" "Code of conduct exists" && ((PASSED++)) || ((FAILED++))
check_file "LICENSE" "License exists" && ((PASSED++)) || ((FAILED++))
check_file "CHANGELOG.md" "Changelog exists" && ((PASSED++)) || ((FAILED++))

echo ""
echo "📋 CHECKING CONFIGURATION TEMPLATES..."
echo ""

# .env examples
check_file ".env.example" ".env.example template exists" && ((PASSED++)) || ((FAILED++))
check_file "backend/.env.example" "backend/.env.example template exists" && ((PASSED++)) || ((FAILED++))
check_file "frontend/.env.example" "frontend/.env.example template exists" && ((PASSED++)) || ((FAILED++))

echo ""
echo "🐙 CHECKING GITHUB TEMPLATES..."
echo ""

# GitHub templates
check_file ".github/ISSUE_TEMPLATE/bug_report.md" "Bug report template exists" && ((PASSED++)) || ((FAILED++))
check_file ".github/ISSUE_TEMPLATE/feature_request.md" "Feature request template exists" && ((PASSED++)) || ((FAILED++))
check_file ".github/ISSUE_TEMPLATE/question.md" "Question template exists" && ((PASSED++)) || ((FAILED++))
check_file ".github/pull_request_template.md" "PR template exists" && ((PASSED++)) || ((FAILED++))

echo ""
echo "🔒 CHECKING SECURITY (files that SHOULD NOT exist)..."
echo ""

# Files that should NOT be tracked
check_no_file ".env" ".env file NOT tracked (correct)" && ((PASSED++)) || ((FAILED++))
check_no_file "backend/.env" "backend/.env NOT tracked (correct)" && ((PASSED++)) || ((FAILED++))
check_no_file "frontend/.env" "frontend/.env NOT tracked (correct)" && ((PASSED++)) || ((FAILED++))

echo ""
echo "🔑 CHECKING FOR LEAKED SECRETS IN GIT HISTORY..."
echo ""

# Check for common secrets in history
LEAKED=0

if git log --all -S "password=" --oneline 2>/dev/null | grep -q .; then
    echo -e "${RED}✗${NC} found 'password=' in git history"
    ((LEAKED++))
else
    echo -e "${GREEN}✓${NC} No 'password=' found in git history"
    ((PASSED++))
fi

if git log --all -S "secret=" --oneline 2>/dev/null | grep -q .; then
    echo -e "${RED}✗${NC} found 'secret=' in git history"
    ((LEAKED++))
else
    echo -e "${GREEN}✓${NC} No 'secret=' found in git history"
    ((PASSED++))
fi

if git log --all -S "api_key=" --oneline 2>/dev/null | grep -q .; then
    echo -e "${RED}✗${NC} found 'api_key=' in git history"
    ((LEAKED++))
else
    echo -e "${GREEN}✓${NC} No 'api_key=' found in git history"
    ((PASSED++))
fi

echo ""
echo "📦 CHECKING .gitignore..."
echo ""

if grep -q "\.env" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓${NC} .env patterns in .gitignore"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} .env NOT in .gitignore"
    ((FAILED++))
fi

if grep -q "\.pem" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓${NC} .pem patterns in .gitignore"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} .pem NOT in .gitignore"
    ((FAILED++))
fi

if grep -q "\.key" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓${NC} .key patterns in .gitignore"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} .key NOT in .gitignore"
    ((FAILED++))
fi

echo ""
echo "📊 SUMMARY"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

if [ $FAILED -eq 0 ] && [ $LEAKED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Your project is ready for GitHub publication:"
    echo ""
    echo "  1. Create repository: https://github.com/new"
    echo "  2. Push code:"
    echo "     git remote add origin https://github.com/yourname/CareSyncVision.git"
    echo "     git branch -M main"
    echo "     git push -u origin main"
    echo ""
    echo "  3. Configure GitHub settings (branch protection, templates, etc)"
    echo "  4. Announce: Twitter, ProductHunt, Reddit, etc."
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME CHECKS FAILED${NC}"
    echo ""
    echo "Failed Checks: $FAILED"
    echo "Git History Issues: $LEAKED"
    echo ""
    echo "Please fix the issues above before pushing to GitHub."
    echo ""
    exit 1
fi
