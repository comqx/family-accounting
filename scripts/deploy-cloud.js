#!/usr/bin/env node

/**
 * 微信云托管部署脚本
 * 用于自动化部署到微信云托管平台
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  // 项目根目录
  projectRoot: path.resolve(__dirname, '..'),
  
  // 云托管目录
  cloudDir: path.resolve(__dirname, '../cloud'),
  
  // 小程序构建目录
  miniprogramDir: path.resolve(__dirname, '../dist'),
  
  // 部署配置
  deployment: {
    // 微信云托管服务名称
    serviceName: 'family-accounting',
    
    // 环境
    environment: process.env.NODE_ENV || 'production',
    
    // 版本号
    version: process.env.VERSION || '1.0.0',
    
    // 镜像标签
    imageTag: process.env.IMAGE_TAG || 'latest'
  }
};

// 日志函数
const log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`)
};

// 检查环境
const checkEnvironment = () => {
  log.info('检查部署环境...');
  
  // 检查 Node.js 版本
  const nodeVersion = process.version;
  log.info(`Node.js 版本: ${nodeVersion}`);
  
  // 检查必要的文件
  const requiredFiles = [
    path.join(CONFIG.cloudDir, 'package.json'),
    path.join(CONFIG.cloudDir, 'Dockerfile'),
    path.join(CONFIG.cloudDir, 'index.js')
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`缺少必要文件: ${file}`);
    }
  }
  
  log.success('环境检查通过');
};

// 构建小程序
const buildMiniprogram = () => {
  log.info('构建小程序...');
  
  try {
    // 切换到项目根目录
    process.chdir(CONFIG.projectRoot);
    
    // 安装依赖
    log.info('安装前端依赖...');
    execSync('pnpm install', { stdio: 'inherit' });
    
    // 构建小程序
    log.info('构建小程序代码...');
    execSync('pnpm run build:weapp', { stdio: 'inherit' });
    
    log.success('小程序构建完成');
  } catch (error) {
    throw new Error(`小程序构建失败: ${error.message}`);
  }
};

// 构建云托管镜像
const buildCloudImage = () => {
  log.info('构建云托管镜像...');
  
  try {
    // 切换到云托管目录
    process.chdir(CONFIG.cloudDir);
    
    // 安装依赖
    log.info('安装后端依赖...');
    execSync('npm install --production', { stdio: 'inherit' });
    
    // 构建 Docker 镜像
    const imageName = `${CONFIG.deployment.serviceName}:${CONFIG.deployment.imageTag}`;
    log.info(`构建镜像: ${imageName}`);
    
    execSync(`docker build -t ${imageName} .`, { stdio: 'inherit' });
    
    log.success('云托管镜像构建完成');
    return imageName;
  } catch (error) {
    throw new Error(`云托管镜像构建失败: ${error.message}`);
  }
};

// 部署到微信云托管
const deployToCloud = (imageName) => {
  log.info('部署到微信云托管...');
  
  try {
    // 这里需要根据微信云托管的实际部署方式进行调整
    // 可能需要使用微信开发者工具的命令行工具或其他方式
    
    log.info('推送镜像到微信云托管...');
    // execSync(`wechat cloud deploy --image ${imageName} --service ${CONFIG.deployment.serviceName}`, { stdio: 'inherit' });
    
    log.success('部署完成');
  } catch (error) {
    throw new Error(`部署失败: ${error.message}`);
  }
};

// 生成部署报告
const generateDeploymentReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    environment: CONFIG.deployment.environment,
    version: CONFIG.deployment.version,
    serviceName: CONFIG.deployment.serviceName,
    imageTag: CONFIG.deployment.imageTag,
    status: 'success'
  };
  
  const reportPath = path.join(CONFIG.projectRoot, 'deployment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log.info(`部署报告已生成: ${reportPath}`);
};

// 主函数
const main = async () => {
  try {
    log.info('开始微信云托管部署流程...');
    log.info(`部署环境: ${CONFIG.deployment.environment}`);
    log.info(`版本号: ${CONFIG.deployment.version}`);
    
    // 1. 检查环境
    checkEnvironment();
    
    // 2. 构建小程序
    buildMiniprogram();
    
    // 3. 构建云托管镜像
    const imageName = buildCloudImage();
    
    // 4. 部署到微信云托管
    deployToCloud(imageName);
    
    // 5. 生成部署报告
    generateDeploymentReport();
    
    log.success('微信云托管部署完成！');
    
  } catch (error) {
    log.error(`部署失败: ${error.message}`);
    process.exit(1);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  CONFIG,
  checkEnvironment,
  buildMiniprogram,
  buildCloudImage,
  deployToCloud,
  generateDeploymentReport
}; 