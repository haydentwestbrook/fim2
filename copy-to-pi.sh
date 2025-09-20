#!/bin/bash

# Script to copy deployment files to Raspberry Pi
# This helps you get the deployment script onto your Pi

set -e

RASPBERRY_PI_HOST="192.168.0.12"
RASPBERRY_PI_USER="hayden"
RASPBERRY_PI_PORT="22"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_step "Copying Deployment Files to Raspberry Pi"

print_status "Copying deployment script to Raspberry Pi..."
print_warning "You will be prompted for your Raspberry Pi password"

# Copy the deployment script to the Pi
scp -P $RASPBERRY_PI_PORT pi-deploy.sh $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST:/home/pi/

if [ $? -eq 0 ]; then
    print_success "Deployment script copied successfully!"
    echo ""
    print_status "Now you can SSH into your Raspberry Pi and run:"
    echo "  ssh $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST"
    echo "  chmod +x /home/pi/pi-deploy.sh"
    echo "  ./pi-deploy.sh"
    echo ""
    print_status "Or run specific commands:"
    echo "  ./pi-deploy.sh --help     # Show help"
    echo "  ./pi-deploy.sh --install  # Install prerequisites only"
    echo "  ./pi-deploy.sh --deploy   # Deploy backend only"
    echo "  ./pi-deploy.sh --status   # Check deployment status"
else
    print_error "Failed to copy deployment script"
    print_status "You can manually copy the file:"
    print_status "1. SSH into your Raspberry Pi: ssh $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST"
    print_status "2. Create the file: nano /home/pi/pi-deploy.sh"
    print_status "3. Copy the contents from pi-deploy.sh in this directory"
fi
