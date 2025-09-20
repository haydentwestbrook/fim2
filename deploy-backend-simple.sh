#!/bin/bash

# Simple FIM Backend Deployment Script for Raspberry Pi
# This script provides step-by-step deployment with manual SSH commands

set -e  # Exit on any error

# Configuration - Update these variables for your setup
RASPBERRY_PI_HOST="192.168.0.12"
RASPBERRY_PI_USER="hayden"
RASPBERRY_PI_PORT="22"
PROJECT_PATH="/home/pi/fim2"
BACKEND_PATH="$PROJECT_PATH/fim-backend"

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

# Function to show manual deployment steps
show_manual_steps() {
    print_step "Manual Deployment Steps"
    
    echo "Since automated SSH is having issues, here are the manual steps:"
    echo ""
    echo "1. SSH into your Raspberry Pi:"
    echo "   ssh $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST"
    echo ""
    echo "2. Clone or update the repository:"
    echo "   if [ -d $PROJECT_PATH ]; then"
    echo "     cd $PROJECT_PATH && git pull origin main"
    echo "   else"
    echo "     git clone https://github.com/haydentwestbrook/fim2.git $PROJECT_PATH"
    echo "     cd $PROJECT_PATH"
    echo "   fi"
    echo ""
    echo "3. Navigate to backend directory:"
    echo "   cd $BACKEND_PATH"
    echo ""
    echo "4. Stop existing containers:"
    echo "   docker-compose down || true"
    echo ""
    echo "5. Create .env file if it doesn't exist:"
    echo "   if [ ! -f .env ]; then"
    echo "     cat > .env << 'EOF'"
    echo "# Database Configuration"
    echo "DB_USER=fim_user"
    echo "DB_PASSWORD=your_secure_password_here"
    echo "DB_NAME=fim_database"
    echo "DB_PORT=5432"
    echo ""
    echo "# Foundry VTT Configuration"
    echo "FIM_FOUNDRY_DATA_ROOT=/var/lib/foundryvtt/data"
    echo ""
    echo "# Frontend URL"
    echo "FRONTEND_URL=http://localhost:3000"
    echo "EOF"
    echo "   fi"
    echo ""
    echo "6. Build and start containers:"
    echo "   docker-compose build --no-cache"
    echo "   docker-compose up -d"
    echo ""
    echo "7. Run database migrations:"
    echo "   docker-compose exec backend npx prisma migrate deploy || echo 'Migration failed or not needed'"
    echo ""
    echo "8. Check status:"
    echo "   docker-compose ps"
    echo "   docker-compose logs --tail=20"
    echo ""
}

# Function to test basic connectivity
test_connectivity() {
    print_step "Testing Basic Connectivity"
    
    print_status "Testing if Raspberry Pi is reachable..."
    if ping -c 1 -W 5 $RASPBERRY_PI_HOST > /dev/null 2>&1; then
        print_success "Raspberry Pi is reachable at $RASPBERRY_PI_HOST"
    else
        print_error "Cannot reach Raspberry Pi at $RASPBERRY_PI_HOST"
        print_status "Please check:"
        print_status "  - Raspberry Pi is powered on"
        print_status "  - Network connection is working"
        print_status "  - IP address is correct: $RASPBERRY_PI_HOST"
        return 1
    fi
    
    print_status "Testing SSH port..."
    if nc -z -w5 $RASPBERRY_PI_HOST $RASPBERRY_PI_PORT 2>/dev/null; then
        print_success "SSH port $RASPBERRY_PI_PORT is open"
    else
        print_error "SSH port $RASPBERRY_PI_PORT is not accessible"
        print_status "Please check:"
        print_status "  - SSH service is running on Raspberry Pi"
        print_status "  - Firewall allows SSH connections"
        print_status "  - Port is correct: $RASPBERRY_PI_PORT"
        return 1
    fi
    
    return 0
}

# Function to show SSH troubleshooting
show_ssh_troubleshooting() {
    print_step "SSH Troubleshooting"
    
    echo "If SSH connection is failing, try these steps on your Raspberry Pi:"
    echo ""
    echo "1. Enable password authentication:"
    echo "   sudo nano /etc/ssh/sshd_config"
    echo "   Find and set: PasswordAuthentication yes"
    echo "   Save and restart: sudo systemctl restart ssh"
    echo ""
    echo "2. Set a password for your user (if not set):"
    echo "   sudo passwd $RASPBERRY_PI_USER"
    echo ""
    echo "3. Check SSH service status:"
    echo "   sudo systemctl status ssh"
    echo ""
    echo "4. Check SSH logs:"
    echo "   sudo journalctl -u ssh -f"
    echo ""
    echo "5. Test SSH locally on Raspberry Pi:"
    echo "   ssh localhost"
    echo ""
}

# Function to show help
show_help() {
    echo "Simple FIM Backend Deployment Script for Raspberry Pi"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -t, --test           Test connectivity only"
    echo "  -m, --manual         Show manual deployment steps"
    echo "  -s, --ssh-troubleshoot  Show SSH troubleshooting guide"
    echo ""
    echo "Current Configuration:"
    echo "  Raspberry Pi Host: $RASPBERRY_PI_HOST"
    echo "  Raspberry Pi User: $RASPBERRY_PI_USER"
    echo "  SSH Port: $RASPBERRY_PI_PORT"
    echo "  Project Path: $PROJECT_PATH"
    echo ""
}

# Main script logic
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--test)
            test_connectivity
            ;;
        -m|--manual)
            show_manual_steps
            ;;
        -s|--ssh-troubleshoot)
            show_ssh_troubleshooting
            ;;
        "")
            # Default: run tests and show manual steps
            print_step "FIM Backend Deployment Helper"
            echo "This script will help you deploy the backend to your Raspberry Pi."
            echo ""
            
            if test_connectivity; then
                print_success "Basic connectivity tests passed!"
                echo ""
                print_warning "SSH automation is not working in this environment."
                print_status "Please use the manual deployment steps below:"
                echo ""
                show_manual_steps
            else
                print_error "Connectivity tests failed. Please fix the issues above first."
                echo ""
                show_ssh_troubleshooting
            fi
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
