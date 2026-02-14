#!/bin/bash
# CareSyncVision AI Server Startup Script

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}CareSyncVision AI Server Startup${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Check Python installation
echo -e "${BLUE}Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed!${NC}"
    exit 1
fi
python_version=$(python3 --version)
echo -e "${GREEN}✓ Found: $python_version${NC}\n"

# Navigate to ai-server directory
cd "$(dirname "$0")/ai-server" || exit
echo -e "${BLUE}Working directory: $(pwd)${NC}\n"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${BLUE}Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}\n"
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}✓ Virtual environment activated${NC}\n"

# Install/upgrade requirements
echo -e "${BLUE}Installing dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Check required files
echo -e "${BLUE}Checking required files...${NC}"
if [ ! -f "app.py" ]; then
    echo -e "${RED}✗ app.py not found!${NC}"
    exit 1
fi
if [ ! -f "detectors/face_detector.py" ]; then
    echo -e "${RED}✗ detectors/face_detector.py not found!${NC}"
    exit 1
fi
if [ ! -f "engines/risk_engine.py" ]; then
    echo -e "${RED}✗ engines/risk_engine.py not found!${NC}"
    exit 1
fi
if [ ! -f "engines/decision_engine.py" ]; then
    echo -e "${RED}✗ engines/decision_engine.py not found!${NC}"
    exit 1
fi
if [ ! -f "engines/action_engine.py" ]; then
    echo -e "${RED}✗ engines/action_engine.py not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ All required files present${NC}\n"

# Create upload directory
mkdir -p uploads
echo -e "${GREEN}✓ Upload directory ready${NC}\n"

# Display startup info
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}Starting CareSyncVision AI Server${NC}"
echo -e "${BLUE}======================================${NC}\n"
echo -e "Server will be available at: ${GREEN}http://0.0.0.0:5000${NC}"
echo -e "API Health Check: ${GREEN}http://localhost:5000/api/health${NC}"
echo -e "Press CTRL+C to stop the server\n"

# Start the server
python3 app.py
