#!/bin/bash

# 家账通小程序 Docker 构建脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="family-accounting"
VERSION=${1:-"latest"}
REGISTRY=${DOCKER_REGISTRY:-""}

echo -e "${BLUE}🐳 家账通小程序 Docker 构建脚本${NC}"
echo -e "${BLUE}================================${NC}"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

# 检查Docker是否运行
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker 服务未运行，请启动 Docker${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 环境检查通过${NC}"

# 清理旧的构建缓存
echo -e "${YELLOW}🧹 清理构建缓存...${NC}"
docker builder prune -f

# 构建不同环境的镜像
build_image() {
    local target=$1
    local tag_suffix=$2
    local description=$3
    
    echo -e "${BLUE}📦 构建 ${description} 镜像...${NC}"
    
    if [ -n "$REGISTRY" ]; then
        IMAGE_NAME="${REGISTRY}/${PROJECT_NAME}:${VERSION}${tag_suffix}"
    else
        IMAGE_NAME="${PROJECT_NAME}:${VERSION}${tag_suffix}"
    fi
    
    docker build \
        --target $target \
        --tag $IMAGE_NAME \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VERSION=$VERSION \
        .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${description} 镜像构建成功: ${IMAGE_NAME}${NC}"
    else
        echo -e "${RED}❌ ${description} 镜像构建失败${NC}"
        exit 1
    fi
}

# 运行测试
run_tests() {
    echo -e "${YELLOW}🧪 运行测试...${NC}"
    
    docker build --target test -t ${PROJECT_NAME}:test .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 所有测试通过${NC}"
    else
        echo -e "${RED}❌ 测试失败${NC}"
        exit 1
    fi
}

# 主构建流程
main() {
    echo -e "${BLUE}开始构建流程...${NC}"
    
    # 1. 运行测试
    run_tests
    
    # 2. 构建开发镜像
    build_image "development" "-dev" "开发环境"
    
    # 3. 构建生产镜像
    build_image "production" "" "生产环境"
    
    # 4. 显示构建结果
    echo -e "${BLUE}📊 构建结果:${NC}"
    docker images | grep $PROJECT_NAME
    
    # 5. 推送到镜像仓库（如果配置了）
    if [ -n "$REGISTRY" ] && [ "$PUSH_TO_REGISTRY" = "true" ]; then
        echo -e "${YELLOW}📤 推送镜像到仓库...${NC}"
        docker push ${REGISTRY}/${PROJECT_NAME}:${VERSION}
        docker push ${REGISTRY}/${PROJECT_NAME}:${VERSION}-dev
        echo -e "${GREEN}✅ 镜像推送完成${NC}"
    fi
    
    echo -e "${GREEN}🎉 构建完成！${NC}"
    echo -e "${BLUE}使用方法:${NC}"
    echo -e "  开发环境: ${YELLOW}docker run -p 10086:10086 ${PROJECT_NAME}:${VERSION}-dev${NC}"
    echo -e "  生产环境: ${YELLOW}docker run -p 8080:80 ${PROJECT_NAME}:${VERSION}${NC}"
    echo -e "  Docker Compose: ${YELLOW}docker-compose up -d${NC}"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [版本号]"
    echo ""
    echo "选项:"
    echo "  版本号    指定镜像版本标签 (默认: latest)"
    echo ""
    echo "环境变量:"
    echo "  DOCKER_REGISTRY      Docker镜像仓库地址"
    echo "  PUSH_TO_REGISTRY     是否推送到镜像仓库 (true/false)"
    echo ""
    echo "示例:"
    echo "  $0                   # 构建 latest 版本"
    echo "  $0 v1.0.0           # 构建 v1.0.0 版本"
    echo "  DOCKER_REGISTRY=registry.example.com $0 v1.0.0"
    echo ""
}

# 检查参数
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac
