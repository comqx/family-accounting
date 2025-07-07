#!/usr/bin/env node

// 简化的代码质量检查脚本 - 专注于关键问题

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SimpleQualityChecker {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.srcDir = path.join(this.projectRoot, 'src');
  }

  // 运行所有检查
  async runAllChecks() {
    console.log('🔍 开始简化质量检查...\n');

    const results = {
      build: await this.checkBuild(),
      syntax: await this.checkSyntax(),
      structure: await this.checkStructure(),
      dependencies: await this.checkDependencies()
    };

    this.generateReport(results);
    return results;
  }

  // 检查构建是否成功
  async checkBuild() {
    console.log('🏗️  检查项目构建...');
    
    try {
      execSync('pnpm build:weapp', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      // 检查构建产物
      const distDir = path.join(this.projectRoot, 'dist');
      const hasAppJs = fs.existsSync(path.join(distDir, 'app.js'));
      const hasAppJson = fs.existsSync(path.join(distDir, 'app.json'));
      
      if (hasAppJs && hasAppJson) {
        console.log('✅ 项目构建成功');
        return { passed: true, message: '构建成功' };
      } else {
        console.log('❌ 构建产物不完整');
        return { passed: false, message: '构建产物不完整' };
      }
    } catch (error) {
      console.log('❌ 项目构建失败');
      return { passed: false, message: '构建失败', error: error.message };
    }
  }

  // 检查基本语法错误
  async checkSyntax() {
    console.log('📝 检查基本语法...');
    
    try {
      const syntaxErrors = [];
      
      // 检查 TypeScript 文件
      const tsFiles = this.findFiles(this.srcDir, /\.ts$/);
      for (const file of tsFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          // 基本语法检查 - 检查是否有明显的语法错误
          if (content.includes('import {') && !content.includes('} from')) {
            syntaxErrors.push(`${file}: 可能的导入语法错误`);
          }
        } catch (err) {
          syntaxErrors.push(`${file}: 文件读取错误`);
        }
      }
      
      // 检查 Vue 文件
      const vueFiles = this.findFiles(this.srcDir, /\.vue$/);
      for (const file of vueFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          // 检查 Vue 文件基本结构
          if (!content.includes('<template>') && !content.includes('<script>')) {
            syntaxErrors.push(`${file}: Vue 文件结构不完整`);
          }
        } catch (err) {
          syntaxErrors.push(`${file}: 文件读取错误`);
        }
      }
      
      if (syntaxErrors.length === 0) {
        console.log('✅ 基本语法检查通过');
        return { passed: true, errors: [] };
      } else {
        console.log(`⚠️  发现 ${syntaxErrors.length} 个语法问题`);
        return { passed: false, errors: syntaxErrors };
      }
    } catch (error) {
      console.log('❌ 语法检查失败');
      return { passed: false, error: error.message };
    }
  }

  // 检查项目结构
  async checkStructure() {
    console.log('📁 检查项目结构...');
    
    const requiredFiles = [
      'src/app.ts',
      'src/app.config.ts',
      'package.json',
      'tsconfig.json'
    ];
    
    const requiredDirs = [
      'src/pages',
      'src/components',
      'src/utils',
      'src/types'
    ];
    
    const missing = [];
    
    // 检查必需文件
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        missing.push(`文件: ${file}`);
      }
    }
    
    // 检查必需目录
    for (const dir of requiredDirs) {
      if (!fs.existsSync(path.join(this.projectRoot, dir))) {
        missing.push(`目录: ${dir}`);
      }
    }
    
    if (missing.length === 0) {
      console.log('✅ 项目结构完整');
      return { passed: true, missing: [] };
    } else {
      console.log(`⚠️  缺少 ${missing.length} 个必需文件/目录`);
      return { passed: false, missing };
    }
  }

  // 检查依赖
  async checkDependencies() {
    console.log('📦 检查依赖状态...');
    
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8')
      );
      
      const hasLockFile = fs.existsSync(path.join(this.projectRoot, 'pnpm-lock.yaml'));
      const hasNodeModules = fs.existsSync(path.join(this.projectRoot, 'node_modules'));
      
      const issues = [];
      
      if (!hasLockFile) {
        issues.push('缺少 pnpm-lock.yaml 文件');
      }
      
      if (!hasNodeModules) {
        issues.push('缺少 node_modules 目录');
      }
      
      // 检查关键依赖
      const requiredDeps = ['@tarojs/taro', 'vue', 'pinia'];
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
          issues.push(`缺少关键依赖: ${dep}`);
        }
      }
      
      if (issues.length === 0) {
        console.log('✅ 依赖状态正常');
        return { passed: true, issues: [] };
      } else {
        console.log(`⚠️  发现 ${issues.length} 个依赖问题`);
        return { passed: false, issues };
      }
    } catch (error) {
      console.log('❌ 依赖检查失败');
      return { passed: false, error: error.message };
    }
  }

  // 查找文件
  findFiles(dir, pattern) {
    const files = [];
    
    const search = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          search(fullPath);
        } else if (stat.isFile() && pattern.test(item)) {
          files.push(fullPath);
        }
      }
    };
    
    search(dir);
    return files;
  }

  // 生成报告
  generateReport(results) {
    console.log('\n📋 简化质量检查报告');
    console.log('='.repeat(50));
    
    const checks = [
      { name: '项目构建', result: results.build },
      { name: '基本语法', result: results.syntax },
      { name: '项目结构', result: results.structure },
      { name: '依赖状态', result: results.dependencies }
    ];
    
    let passedCount = 0;
    
    checks.forEach(check => {
      const status = check.result?.passed ? '✅ 通过' : '❌ 失败';
      console.log(`${check.name}: ${status}`);
      
      if (check.result?.passed) {
        passedCount++;
      } else if (check.result?.message) {
        console.log(`  └─ ${check.result.message}`);
      }
    });
    
    console.log('='.repeat(50));
    console.log(`总体评分: ${passedCount}/${checks.length} (${Math.round(passedCount / checks.length * 100)}%)`);
    
    if (passedCount === checks.length) {
      console.log('🎉 所有关键检查都通过了！项目状态良好。');
    } else if (passedCount >= checks.length * 0.75) {
      console.log('👍 大部分检查通过，项目基本可用。');
    } else {
      console.log('⚠️  多个关键检查未通过，建议修复后再部署。');
    }
    
    // 保存简化报告
    const reportPath = path.join(this.projectRoot, 'quality-report-simple.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: checks.length,
        passed: passedCount,
        score: Math.round(passedCount / checks.length * 100)
      }
    }, null, 2));
    
    console.log(`\n📄 简化报告已保存到: ${reportPath}`);
  }
}

// 运行检查
if (require.main === module) {
  const checker = new SimpleQualityChecker();
  checker.runAllChecks().catch(console.error);
}

module.exports = SimpleQualityChecker;
