#!/bin/bash
# feature-3 Build and Deploy Script
# 
# Usage:
#   ./build.sh build   - Build Docker image
#   ./build.sh test    - Build and run tests
#   ./build.sh run     - Build and run container
#   ./build.sh deploy  - Deploy with docker-compose

set -e

FEATURE_NAME="feature-3"
PROJECT_NAME="hello-world"
IMAGE_NAME="hello-world-feature-3"
# Determine correct path to generated code relative to deployment folder
# If in projects/PROJECT/deployment/FEATURE, go up 3 levels to workspace root
GENERATED_CODE_DIR="../../../../generated-code/${PROJECT_NAME}-${FEATURE_NAME}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  ${FEATURE_NAME} Deployment Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Change to generated code directory for build context
cd "$(dirname "$0")"
DEPLOY_DIR="$(pwd)"
cd "${GENERATED_CODE_DIR}"

case "$1" in
  build)
    echo -e "${GREEN}[1/2] Building Docker image: ${IMAGE_NAME}${NC}"
    docker build -f "${DEPLOY_DIR}/Dockerfile" -t "${IMAGE_NAME}:latest" .
    echo -e "${GREEN}✓ Image built successfully${NC}"
    echo ""
    echo -e "${BLUE}Image: ${IMAGE_NAME}:latest${NC}"
    docker images | grep "${IMAGE_NAME}"
    ;;

  test)
    echo -e "${GREEN}[1/3] Building Docker image${NC}"
    docker build -f "${DEPLOY_DIR}/Dockerfile" -t "${IMAGE_NAME}:latest" .
    
    echo -e "${GREEN}[2/3] Running tests in container${NC}"
    docker run --rm "${IMAGE_NAME}:latest" npm test
    
    echo -e "${GREEN}[3/3] Testing health endpoint${NC}"
    CONTAINER_ID=$(docker run -d -p 3001:3000 "${IMAGE_NAME}:latest")
    sleep 3
    curl -f http://localhost:3001/health || (docker logs "$CONTAINER_ID" && docker stop "$CONTAINER_ID" && exit 1)
    docker stop "$CONTAINER_ID"
    
    echo -e "${GREEN}✓ All tests passed${NC}"
    ;;

  run)
    echo -e "${GREEN}[1/2] Building Docker image${NC}"
    docker build -f "${DEPLOY_DIR}/Dockerfile" -t "${IMAGE_NAME}:latest" .
    
    echo -e "${GREEN}[2/2] Starting container${NC}"
    docker run --rm -p 3000:3000 --name "${IMAGE_NAME}" "${IMAGE_NAME}:latest"
    ;;

  deploy)
    echo -e "${GREEN}[1/2] Building image${NC}"
    docker build -f "${DEPLOY_DIR}/Dockerfile" -t "${IMAGE_NAME}:latest" .
    
    echo -e "${GREEN}[2/2] Starting with docker-compose${NC}"
    cd "${DEPLOY_DIR}"
    docker-compose up -d
    
    echo -e "${GREEN}✓ Deployed successfully${NC}"
    echo ""
    echo -e "${BLUE}Check status: docker-compose ps${NC}"
    echo -e "${BLUE}View logs:    docker-compose logs -f${NC}"
    echo -e "${BLUE}Stop:         docker-compose down${NC}"
    ;;

  stop)
    echo -e "${GREEN}Stopping deployment${NC}"
    cd "${DEPLOY_DIR}"
    docker-compose down
    echo -e "${GREEN}✓ Stopped${NC}"
    ;;

  *)
    echo "Usage: $0 {build|test|run|deploy|stop}"
    echo ""
    echo "Commands:"
    echo "  build   - Build Docker image only"
    echo "  test    - Build and run all tests (npm test + health check)"
    echo "  run     - Build and run container interactively"
    echo "  deploy  - Deploy with docker-compose (detached mode)"
    echo "  stop    - Stop docker-compose deployment"
    exit 1
    ;;
esac
