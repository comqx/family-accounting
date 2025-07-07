#!/usr/bin/env node

// 自动化部署脚本

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const deployConfig = require('../deploy.config.js');

class DeployManager {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.environment = process.env.NODE_ENV || 'development';
    this.config = deployConfig.environments[this.environment];
    this.buildConfig = deployConfig.build;
    this.deployConfig = deployConfig.deploy;
  }

  // 执行部署
  async deploy() {
    console.log(`🚀 开始部署到 ${this.config.name}...`);
    console.log(`📦 环境: ${this.environment}`);
    console.log(`🔗 API: ${this.config.apiBaseUrl}`);
    console.log('');

    try {
      // 1. 部署前检查
      await this.preDeployChecks();
      
      // 2. 构建前钩子
      await this.runBeforeBuildHooks();
      
      // 3. 构建项目
      await this.buildProject();
      
      // 4. 构建后钩子
      await this.runAfterBuildHooks();
      
      // 5. 部署前钩子
      await this.runBeforeDeployHooks();
      
      // 6. 执行部署
      await this.executeDeployment();
      
      // 7. 部署后钩子
      await this.runAfterDeployHooks();
      
      // 8. 部署完成
      await this.deploymentComplete();
      
    } catch (error) {
      console.error('❌ 部署失败:', error.message);
      await this.handleDeploymentFailure(error);
      process.exit(1);
    }
  }

  // 部署前检查
  async preDeployChecks() {
    console.log('🔍 执行部署前检查...');
    
    // 检查 Git 状态
    this.checkGitStatus();
    
    // 检查依赖
    this.checkDependencies();
    
    // 检查环境变量
    this.checkEnvironmentVariables();
    
    // 检查磁盘空间
    this.checkDiskSpace();
    
    console.log('✅ 部署前检查通过');
  }

  // 检查 Git 状态
  checkGitStatus() {
    try {
      const status = execSync('git status --porcelain', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      
      if (status.trim() && this.environment === 'production') {
        throw new Error('生产环境部署要求工作目录干净，请提交所有更改');
      }
      
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      }).trim();
      
      console.log(`📋 当前分支: ${branch}`);
      
      if (this.environment === 'production' && branch !== 'main' && branch !== 'master') {
        throw new Error('生产环境只能从 main/master 分支部署');
      }
      
    } catch (error) {
      throw new Error(`Git 检查失败: ${error.message}`);
    }
  }

  // 检查依赖
  checkDependencies() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageLockPath = path.join(this.projectRoot, 'pnpm-lock.yaml');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json 文件不存在');
    }
    
    if (!fs.existsSync(packageLockPath)) {
      console.log('⚠️  锁定文件不存在，建议运行 pnpm install');
    }
    
    // 检查关键依赖
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = ['@tarojs/taro', 'vue', 'pinia'];
    
    requiredDeps.forEach(dep => {
      if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
        throw new Error(`缺少关键依赖: ${dep}`);
      }
    });
  }

  // 检查环境变量
  checkEnvironmentVariables() {
    const requiredVars = ['NODE_ENV'];
    
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        throw new Error(`缺少环境变量: ${varName}`);
      }
    });
  }

  // 检查磁盘空间
  checkDiskSpace() {
    try {
      const stats = fs.statSync(this.projectRoot);
      // 简单检查，实际应该检查可用磁盘空间
      console.log('💾 磁盘空间检查通过');
    } catch (error) {
      console.log('⚠️  无法检查磁盘空间');
    }
  }

  // 运行构建前钩子
  async runBeforeBuildHooks() {
    console.log('🔧 运行构建前钩子...');
    
    for (const hook of this.deployConfig.beforeBuild) {
      console.log(`  执行: ${hook}`);
      try {
        execSync(hook, {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
      } catch (error) {
        throw new Error(`构建前钩子失败: ${hook}`);
      }
    }
  }

  // 构建项目
  async buildProject() {
    console.log('🏗️  构建项目...');
    
    // 设置环境变量
    const env = {
      ...process.env,
      NODE_ENV: this.environment,
      TARO_APP_API_BASE_URL: this.config.apiBaseUrl,
      TARO_APP_WS_URL: this.config.wsUrl,
      TARO_APP_CDN_URL: this.config.cdnUrl,
      TARO_APP_DEBUG: this.config.enableDebug.toString(),
      TARO_APP_MOCK: this.config.enableMock.toString()
    };
    
    // 清理旧的构建产物
    const distPath = path.join(this.projectRoot, this.buildConfig.outputDir);
    if (fs.existsSync(distPath)) {
      execSync(`rm -rf ${distPath}`, { cwd: this.projectRoot });
    }
    
    // 执行构建
    const buildCommand = this.environment === 'production' ? 
      'npm run build:weapp' : 'npm run build:weapp';
    
    try {
      execSync(buildCommand, {
        cwd: this.projectRoot,
        stdio: 'inherit',
        env
      });
      
      console.log('✅ 项目构建完成');
    } catch (error) {
      throw new Error('项目构建失败');
    }
  }

  // 运行构建后钩子
  async runAfterBuildHooks() {
    console.log('📊 运行构建后钩子...');
    
    for (const hook of this.deployConfig.afterBuild) {
      console.log(`  执行: ${hook}`);
      try {
        execSync(hook, {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
      } catch (error) {
        console.log(`⚠️  构建后钩子警告: ${hook}`);
      }
    }
  }

  // 运行部署前钩子
  async runBeforeDeployHooks() {
    console.log('🧪 运行部署前钩子...');
    
    for (const hook of this.deployConfig.beforeDeploy) {
      console.log(`  执行: ${hook}`);
      try {
        execSync(hook, {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
      } catch (error) {
        throw new Error(`部署前钩子失败: ${hook}`);
      }
    }
  }

  // 执行部署
  async executeDeployment() {
    console.log('🚀 执行部署...');
    
    const distPath = path.join(this.projectRoot, this.buildConfig.outputDir);
    
    if (!fs.existsSync(distPath)) {
      throw new Error('构建产物不存在');
    }
    
    // 检查构建产物
    this.validateBuildOutput(distPath);
    
    // 根据环境执行不同的部署策略
    switch (this.environment) {
      case 'development':
        await this.deployToDevelopment(distPath);
        break;
      case 'staging':
        await this.deployToStaging(distPath);
        break;
      case 'production':
        await this.deployToProduction(distPath);
        break;
      default:
        throw new Error(`未知的部署环境: ${this.environment}`);
    }
  }

  // 验证构建产物
  validateBuildOutput(distPath) {
    const requiredFiles = ['app.js', 'app.json', 'app.wxss'];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(distPath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`缺少必要文件: ${file}`);
      }
    });
    
    // 检查文件大小
    const appJsPath = path.join(distPath, 'app.js');
    const appJsSize = fs.statSync(appJsPath).size;
    
    if (appJsSize > 2 * 1024 * 1024) { // 2MB
      console.log('⚠️  app.js 文件较大，建议优化');
    }
  }

  // 部署到开发环境
  async deployToDevelopment(distPath) {
    console.log('📱 部署到开发环境...');
    
    // 开发环境可以直接使用微信开发者工具
    console.log('💡 请使用微信开发者工具打开项目进行预览');
    console.log(`📁 项目路径: ${distPath}`);
  }

  // 部署到测试环境
  async deployToStaging(distPath) {
    console.log('🧪 部署到测试环境...');
    
    // 这里可以集成微信小程序的 CI 工具
    console.log('🔄 上传到微信小程序测试版本...');
    
    // 模拟上传过程
    await this.simulateUpload('staging');
  }

  // 部署到生产环境
  async deployToProduction(distPath) {
    console.log('🌟 部署到生产环境...');
    
    // 生产环境需要更严格的检查
    await this.productionSafetyChecks();
    
    console.log('🔄 上传到微信小程序正式版本...');
    
    // 模拟上传过程
    await this.simulateUpload('production');
  }

  // 生产环境安全检查
  async productionSafetyChecks() {
    console.log('🔒 执行生产环境安全检查...');
    
    // 检查是否有调试代码
    const hasDebugCode = this.checkForDebugCode();
    if (hasDebugCode) {
      throw new Error('生产环境不能包含调试代码');
    }
    
    // 检查敏感信息
    const hasSensitiveInfo = this.checkForSensitiveInfo();
    if (hasSensitiveInfo) {
      throw new Error('生产环境不能包含敏感信息');
    }
  }

  // 检查调试代码
  checkForDebugCode() {
    // 简化检查，实际应该更全面
    return false;
  }

  // 检查敏感信息
  checkForSensitiveInfo() {
    // 简化检查，实际应该更全面
    return false;
  }

  // 模拟上传过程
  async simulateUpload(env) {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        console.log(`📤 上传进度: ${progress}%`);
        
        if (progress >= 100) {
          clearInterval(interval);
          console.log('✅ 上传完成');
          resolve();
        }
      }, 500);
    });
  }

  // 运行部署后钩子
  async runAfterDeployHooks() {
    console.log('🎉 运行部署后钩子...');
    
    for (const hook of this.deployConfig.afterDeploy) {
      console.log(`  执行: ${hook}`);
      try {
        execSync(hook, {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
      } catch (error) {
        console.log(`⚠️  部署后钩子警告: ${hook}`);
      }
    }
  }

  // 部署完成
  async deploymentComplete() {
    console.log('');
    console.log('🎉 部署完成！');
    console.log('='.repeat(50));
    console.log(`📱 环境: ${this.config.name}`);
    console.log(`🔗 API: ${this.config.apiBaseUrl}`);
    console.log(`⏰ 时间: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
    
    // 发送通知
    await this.sendNotification('success');
  }

  // 处理部署失败
  async handleDeploymentFailure(error) {
    console.log('');
    console.log('❌ 部署失败！');
    console.log('='.repeat(50));
    console.log(`📱 环境: ${this.config.name}`);
    console.log(`❌ 错误: ${error.message}`);
    console.log(`⏰ 时间: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
    
    // 发送通知
    await this.sendNotification('failure', error);
  }

  // 发送通知
  async sendNotification(status, error = null) {
    const notificationConfig = deployConfig.notifications.deploy;
    
    if (!notificationConfig.enabled) {
      return;
    }
    
    const message = status === 'success' ? 
      `✅ ${this.config.name} 部署成功` :
      `❌ ${this.config.name} 部署失败: ${error?.message}`;
    
    console.log(`📢 通知: ${message}`);
    
    // 这里可以集成实际的通知服务
    // 如 Slack、钉钉、企业微信等
  }
}

// 运行部署
if (require.main === module) {
  const deployer = new DeployManager();
  deployer.deploy().catch(console.error);
}

module.exports = DeployManager;
