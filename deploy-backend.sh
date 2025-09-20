#!/bin/bash

# FIM Backend Deployment Script for Raspberry Pi
# This script deploys the backend to a Raspberry Pi via SSH

set -e  # Exit on any error

# Configuration - Update these variables for your setup
RASPBERRY_PI_HOST="192.168.0.12"
RASPBERRY_PI_USER="hayden"
RASPBERRY_PI_PORT="22"
PROJECT_PATH="/home/pi/fim2"  # Path on Raspberry Pi where the project will be cloned
BACKEND_PATH="$PROJECT_PATH/fim-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if required variables are set
check_config() {
    if [ -z "$RASPBERRY_PI_HOST" ] || [ -z "$RASPBERRY_PI_USER" ]; then
        print_error "Please configure RASPBERRY_PI_HOST and RASPBERRY_PI_USER variables in the script"
        print_status "Edit the script and set:"
        print_status "  RASPBERRY_PI_HOST=\"your-pi-ip-or-hostname\""
        print_status "  RASPBERRY_PI_USER=\"your-pi-username\""
        exit 1
    fi
}

# Function to test SSH connection
test_ssh_connection() {
    print_status "Testing SSH connection to $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST..."
    print_warning "You will be prompted for the Raspberry Pi password"
    
    # Test SSH connection - let it prompt for password naturally
    print_status "Please enter your Raspberry Pi password when prompted..."
    if ssh -o ConnectTimeout=10 -o PasswordAuthentication=yes -o PubkeyAuthentication=no -o PreferredAuthentications=password -p $RASPBERRY_PI_PORT $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST "echo 'SSH connection successful'"; then
        print_success "SSH connection successful"
    else
        print_error "SSH connection failed. Please check:"
        print_error "  - Host: $RASPBERRY_PI_HOST"
        print_error "  - User: $RASPBERRY_PI_USER"
        print_error "  - Port: $RASPBERRY_PI_PORT"
        print_error "  - Password is correct"
        print_error "  - SSH password authentication is enabled on Raspberry Pi"
        print_status "To enable password authentication on Raspberry Pi, run:"
        print_status "  sudo nano /etc/ssh/sshd_config"
        print_status "  Set: PasswordAuthentication yes"
        print_status "  Then: sudo systemctl restart ssh"
        exit 1
    fi
}

# Function to check if Docker and Docker Compose are installed on Pi
check_docker_on_pi() {
    print_status "Checking Docker installation on Raspberry Pi..."
    if ssh -o PasswordAuthentication=yes -o PubkeyAuthentication=no -o PreferredAuthentications=password -p $RASPBERRY_PI_PORT $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST "docker --version && docker-compose --version"; then
        print_success "Docker and Docker Compose are installed"
    else
        print_error "Docker or Docker Compose not found on Raspberry Pi"
        print_status "Please install Docker and Docker Compose on your Raspberry Pi:"
        print_status "  curl -fsSL https://get.docker.com -o get-docker.sh"
        print_status "  sudo sh get-docker.sh"
        print_status "  sudo usermod -aG docker $USER"
        print_status "  sudo apt-get install docker-compose-plugin"
        exit 1
    fi
}

# Function to create .env file if it doesn't exist
create_env_file() {
    print_status "Checking for .env file on Raspberry Pi..."
    ssh -o PasswordAuthentication=yes -o PubkeyAuthentication=no -o PreferredAuthentications=password -p $RASPBERRY_PI_PORT $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST "
        if [ ! -f $BACKEND_PATH/.env ]; then
            echo 'Creating .env file...'
            cat > $BACKEND_PATH/.env << 'EOF'
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
            echo 'Please edit the .env file with your actual configuration values'
        else
            echo '.env file already exists'
        fi
    "
}

# Function to deploy the backend
deploy_backend() {
    print_status "Starting backend deployment to Raspberry Pi..."
    
    # Step 1: Clone or update the repository
    print_status "Updating repository on Raspberry Pi..."
    ssh -o PasswordAuthentication=yes -o PubkeyAuthentication=no -o PreferredAuthentications=password -p $RASPBERRY_PI_PORT $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST "
        if [ -d $PROJECT_PATH ]; then
            echo 'Repository exists, pulling latest changes...'
            cd $PROJECT_PATH
            git pull origin main
        else
            echo 'Cloning repository...'
            git clone https://github.com/haydentwestbrook/fim2.git $PROJECT_PATH
            cd $PROJECT_PATH
        fi
    "
    
    # Step 2: Stop existing containers
    print_status "Stopping existing containers..."
    ssh -o PasswordAuthentication=yes -o PubkeyAuthentication=no -o PreferredAuthentications=password -p $RASPBERRY_PI_PORT $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST "
        cd $BACKEND_PATH
        if [ -f docker-compose.yml ]; then
            docker-compose down || true
        fi
    "
    
    # Step 3: Create .env file if needed
    create_env_file
    
    # Step 4: Build and start containers
    print_status "Building and starting containers..."
    ssh -o PasswordAuthentication=yes -o PubkeyAuthentication=no -o PreferredAuthentications=password -p $RASPBERRY_PI_PORT $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST "
        cd $BACKEND_PATH
        echo 'Building Docker images...'
        docker-compose build --no-cache
        
        echo 'Starting services...'
        docker-compose up -d
        
        echo 'Waiting for services to start...'
        sleep 10
        
        echo 'Checking container status...'
        docker-compose ps
    "
    
    # Step 5: Run database migrations
    print_status "Running database migrations..."
    ssh -o PasswordAuthentication=yes -o PubkeyAuthentication=no -o PreferredAuthentications=password -p $RASPBERRY_PI_PORT $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST "
        cd $BACKEND_PATH
        echo 'Running Prisma migrations...'
        docker-compose exec backend npx prisma migrate deploy || echo 'Migration failed or not needed'
    "
    
    print_success "Backend deployment completed!"
}

# Function to show deployment status
show_status() {
    print_status "Checking deployment status..."
    ssh -o PasswordAuthentication=yes -o PubkeyAuthentication=no -o PreferredAuthentications=password -p $RASPBERRY_PI_PORT $RASPBERRY_PI_USER@$RASPBERRY_PI_HOST "
        cd $BACKEND_PATH
        echo '=== Container Status ==='
        docker-compose ps
        echo ''
        echo '=== Recent Logs ==='
        docker-compose logs --tail=20
    "
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
    echo "  -c, --config   Show configuration"
    echo ""
    echo "Before running, configure the following variables in the script:"
    echo "  RASPBERRY_PI_HOST    - IP address or hostname of your Raspberry Pi"
    echo "  RASPBERRY_PI_USER    - Username for SSH connection"
    echo "  RASPBERRY_PI_PORT    - SSH port (default: 22)"
    echo "  PROJECT_PATH         - Path on Pi where project will be cloned"
    echo ""
    echo "Prerequisites:"
    echo "  - SSH password authentication enabled on Raspberry Pi"
    echo "  - Docker and Docker Compose installed on Raspberry Pi"
    echo "  - Git installed on Raspberry Pi"
}

# Function to show current configuration
show_config() {
    echo "Current Configuration:"
    echo "  Raspberry Pi Host: $RASPBERRY_PI_HOST"
    echo "  Raspberry Pi User: $RASPBERRY_PI_USER"
    echo "  SSH Port: $RASPBERRY_PI_PORT"
    echo "  Project Path: $PROJECT_PATH"
    echo "  Backend Path: $BACKEND_PATH"
}

# Main script logic
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--status)
            check_config
            test_ssh_connection
            show_status
            exit 0
            ;;
        -c|--config)
            show_config
            exit 0
            ;;
        "")
            # Default: deploy
            check_config
            test_ssh_connection
            check_docker_on_pi
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
