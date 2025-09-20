#!/bin/bash

# FIM Backend Deployment Script for Raspberry Pi
# Run this script ON the Raspberry Pi

set -e  # Exit on any error

# Configuration
PROJECT_PATH="/home/pi/fim2"
BACKEND_PATH="$PROJECT_PATH/fim-backend"
REPO_URL="https://github.com/haydentwestbrook/fim2.git"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Docker if not present
install_docker() {
    if command_exists docker; then
        print_success "Docker is already installed"
        return 0
    fi
    
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    print_success "Docker installed successfully"
    print_warning "You may need to log out and back in for Docker group changes to take effect"
}

# Function to install Git if not present
install_git() {
    if command_exists git; then
        print_success "Git is already installed"
        return 0
    fi
    
    print_status "Installing Git..."
    sudo apt-get update
    sudo apt-get install -y git
    print_success "Git installed successfully"
}

# Function to clone or update repository
setup_repository() {
    print_step "Setting up Repository"
    
    if [ -d "$PROJECT_PATH/.git" ]; then
        print_status "Repository exists, updating..."
        cd "$PROJECT_PATH"
        git pull origin main
        print_success "Repository updated"
    else
        print_status "Cloning repository..."
        git clone "$REPO_URL" "$PROJECT_PATH"
        print_success "Repository cloned"
    fi
}

# Function to create .env file
create_env_file() {
    print_step "Creating Environment File"
    
    cd "$BACKEND_PATH"
    
    if [ -f .env ]; then
        print_status ".env file already exists"
        print_warning "Please review and update the .env file if needed:"
        cat .env
    else
        print_status "Creating .env file..."
        cat > .env << 'EOF'
# Database Configuration
DB_USER=fim_user
DB_PASSWORD=your_secure_password_here
DB_NAME=fim_database
DB_PORT=5432

# Foundry VTT Configuration
FIM_FOUNDRY_DATA_ROOT=/var/lib/foundryvtt/data

# Frontend URL
FRONTEND_URL=http://localhost:3000
EOF
        print_success ".env file created"
        print_warning "Please edit the .env file with your actual configuration values:"
        print_status "nano $BACKEND_PATH/.env"
    fi
}

# Function to setup Foundry data directory
setup_foundry_directory() {
    print_step "Setting up Foundry Data Directory"
    
    FOUNDRY_DIR="/var/lib/foundryvtt/data"
    
    if [ ! -d "$FOUNDRY_DIR" ]; then
        print_status "Creating Foundry data directory..."
        sudo mkdir -p "$FOUNDRY_DIR"
        sudo chown pi:pi "$FOUNDRY_DIR"
        print_success "Foundry data directory created"
    else
        print_success "Foundry data directory already exists"
    fi
}

# Function to deploy backend
deploy_backend() {
    print_step "Deploying Backend"
    
    cd "$BACKEND_PATH"
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down || true
    
    # Build and start containers
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 15
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose exec -T backend npx prisma migrate deploy || print_warning "Migration failed or not needed"
    
    print_success "Backend deployment completed!"
}

# Function to show deployment status
show_status() {
    print_step "Deployment Status"
    
    cd "$BACKEND_PATH"
    
    echo "=== Container Status ==="
    docker-compose ps
    
    echo ""
    echo "=== Recent Logs ==="
    docker-compose logs --tail=10
    
    echo ""
    echo "=== Backend Health Check ==="
    if curl -s http://localhost:3001/health > /dev/null; then
        print_success "Backend is responding"
    else
        print_warning "Backend is not responding yet (may still be starting)"
    fi
}

# Function to show help
show_help() {
    echo "FIM Backend Deployment Script for Raspberry Pi"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -s, --status   Show deployment status"
    echo "  -i, --install  Install prerequisites only"
    echo "  -d, --deploy   Deploy backend only (assumes prerequisites are installed)"
    echo "  -f, --full     Full deployment (install + deploy)"
    echo ""
    echo "This script should be run ON the Raspberry Pi, not from your local machine."
    echo ""
}

# Main script logic
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--status)
            show_status
            exit 0
            ;;
        -i|--install)
            print_step "Installing Prerequisites"
            install_docker
            install_git
            print_success "Prerequisites installation completed"
            ;;
        -d|--deploy)
            setup_repository
            create_env_file
            setup_foundry_directory
            deploy_backend
            show_status
            ;;
        -f|--full)
            print_step "Full Deployment"
            install_docker
            install_git
            setup_repository
            create_env_file
            setup_foundry_directory
            deploy_backend
            show_status
            ;;
        "")
            # Default: full deployment
            print_step "FIM Backend Deployment"
            install_docker
            install_git
            setup_repository
            create_env_file
            setup_foundry_directory
            deploy_backend
            show_status
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
