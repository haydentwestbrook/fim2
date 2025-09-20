# FIM Backend Deployment Guide

## Prerequisites Check

Before starting, ensure your Raspberry Pi has:
- [ ] Docker installed
- [ ] Docker Compose installed  
- [ ] Git installed
- [ ] SSH password authentication enabled

## Step 1: Test SSH Connection

Open a new terminal and test SSH connection:

```bash
ssh hayden@192.168.0.12
```

If this fails, you may need to:
1. Enable password authentication on Raspberry Pi:
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Find and uncomment: PasswordAuthentication yes
   sudo systemctl restart ssh
   ```

2. Set a password for your user:
   ```bash
   sudo passwd hayden
   ```

## Step 2: Prepare Raspberry Pi

Once SSH is working, run these commands on your Raspberry Pi:

### Install Docker (if not already installed):
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### Install Git (if not already installed):
```bash
sudo apt-get update
sudo apt-get install git
```

## Step 3: Deploy the Backend

### Clone/Update Repository:
```bash
# Create project directory
sudo mkdir -p /home/pi/fim2
sudo chown pi:pi /home/pi/fim2

# Clone or update repository
if [ -d /home/pi/fim2/.git ]; then
    cd /home/pi/fim2
    git pull origin main
else
    git clone https://github.com/haydentwestbrook/fim2.git /home/pi/fim2
    cd /home/pi/fim2
fi
```

### Navigate to Backend:
```bash
cd /home/pi/fim2/fim-backend
```

### Stop Existing Containers:
```bash
docker-compose down || true
```

### Create Environment File:
```bash
if [ ! -f .env ]; then
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
    echo "Created .env file. Please edit it with your actual values."
fi
```

### Build and Start Containers:
```bash
# Build Docker images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Wait for services to start
sleep 10
```

### Run Database Migrations:
```bash
docker-compose exec backend npx prisma migrate deploy || echo "Migration failed or not needed"
```

## Step 4: Verify Deployment

### Check Container Status:
```bash
docker-compose ps
```

### Check Logs:
```bash
docker-compose logs --tail=20
```

### Test Backend API:
```bash
curl http://localhost:3001/health || echo "Backend not responding"
```

## Step 5: Configure Firewall (if needed)

If you need to access the backend from other devices:

```bash
# Allow port 3001 through firewall
sudo ufw allow 3001
```

## Troubleshooting

### If containers fail to start:
```bash
# Check detailed logs
docker-compose logs

# Check Docker daemon
sudo systemctl status docker

# Restart Docker if needed
sudo systemctl restart docker
```

### If database connection fails:
```bash
# Check if database container is running
docker-compose ps db

# Check database logs
docker-compose logs db
```

### If backend can't access Foundry data:
```bash
# Check if Foundry data directory exists
ls -la /var/lib/foundryvtt/data

# Create directory if needed
sudo mkdir -p /var/lib/foundryvtt/data
sudo chown pi:pi /var/lib/foundryvtt/data
```

## Useful Commands

### View all containers:
```bash
docker ps -a
```

### Restart specific service:
```bash
docker-compose restart backend
```

### View real-time logs:
```bash
docker-compose logs -f backend
```

### Stop all services:
```bash
docker-compose down
```

### Remove all containers and volumes (clean slate):
```bash
docker-compose down -v
docker system prune -a
```
