# 家账通小程序发布上线指南

## 📋 目录
- [发布前准备](#发布前准备)
- [微信小程序注册](#微信小程序注册)
- [开发者工具配置](#开发者工具配置)
- [项目配置](#项目配置)
- [代码上传](#代码上传)
- [审核发布](#审核发布)
- [后端服务部署](#后端服务部署)
- [域名配置](#域名配置)
- [监控配置](#监控配置)
- [发布后维护](#发布后维护)

## 🚀 发布前准备

### 1. 检查清单
- [ ] 代码质量检查通过
- [ ] 功能测试完成
- [ ] 性能优化完成
- [ ] 安全检查通过
- [ ] 用户协议和隐私政策准备
- [ ] 小程序图标和截图准备
- [ ] 服务器环境准备

### 2. 运行质量检查
```bash
# 代码质量检查
npm run quality-check

# 类型检查
npm run type-check

# 安全检查
npm run security-check

# 构建测试
npm run build:weapp
```

### 3. 准备发布资料
- 小程序名称：家账通
- 小程序简介：智能家庭记账助手
- 服务类别：工具 > 效率
- 小程序图标：144x144px
- 小程序截图：至少3张，最多5张

## 📱 微信小程序注册

### 1. 注册小程序账号
1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 点击"立即注册" > "小程序"
3. 填写账号信息（建议使用企业邮箱）
4. 邮箱验证
5. 信息登记（个人/企业）
6. 微信认证（可选，企业建议认证）

### 2. 完善小程序信息
1. 登录小程序后台
2. 设置 > 基本设置
   - 小程序名称：家账通
   - 小程序头像：上传准备好的图标
   - 小程序介绍：智能家庭记账助手，支持多人协作、账单识别、数据分析
   - 服务类别：工具 > 效率

### 3. 获取小程序信息
- AppID：在开发 > 开发管理 > 开发设置中获取
- AppSecret：在开发 > 开发管理 > 开发设置中获取

## 🛠 开发者工具配置

### 1. 下载安装
- 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 安装并登录微信账号

### 2. 导入项目
1. 打开微信开发者工具
2. 选择"小程序"
3. 点击"导入项目"
4. 项目目录：选择 `family-accounting/dist` 目录
5. AppID：填入获取的小程序AppID
6. 项目名称：家账通

## ⚙️ 项目配置

### 1. 更新项目配置
编辑 `project.config.json`：
```json
{
  "description": "家账通 - 智能家庭记账小程序",
  "packOptions": {
    "ignore": [
      {
        "type": "file",
        "value": ".eslintrc.js"
      }
    ]
  },
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": true,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "enableEngineNative": false,
    "useIsolateContext": false,
    "userConfirmedBundleSwitch": false,
    "packNpmManually": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "disableUseStrict": false,
    "minifyWXML": true,
    "showES6CompileOption": false,
    "useCompilerPlugins": false
  },
  "compileType": "miniprogram",
  "libVersion": "2.19.4",
  "appid": "你的小程序AppID",
  "projectname": "家账通",
  "debugOptions": {
    "hidedInDevtools": []
  },
  "scripts": {},
  "staticServerOptions": {
    "baseURL": "",
    "servePath": ""
  },
  "isGameTourist": false,
  "condition": {
    "search": {
      "list": []
    },
    "conversation": {
      "list": []
    },
    "game": {
      "list": []
    },
    "plugin": {
      "list": []
    },
    "gamePlugin": {
      "list": []
    },
    "miniprogram": {
      "list": []
    }
  }
}
```

### 2. 配置服务器域名
在小程序后台 > 开发 > 开发管理 > 开发设置 > 服务器域名中配置：

**request合法域名：**
```
https://api.family-accounting.com
```

**socket合法域名：**
```
wss://ws.family-accounting.com
```

**uploadFile合法域名：**
```
https://upload.family-accounting.com
```

**downloadFile合法域名：**
```
https://cdn.family-accounting.com
```

### 3. 配置业务域名
如果需要在小程序中打开网页，需要配置业务域名：
```
https://family-accounting.com
```

## 📤 代码上传

### 1. 生产环境构建
```bash
# 设置生产环境
export NODE_ENV=production

# 构建项目
npm run build:weapp

# 或使用部署脚本
npm run deploy:prod
```

### 2. 上传代码
1. 在微信开发者工具中打开项目
2. 点击工具栏"上传"按钮
3. 填写版本号和项目备注
   - 版本号：1.0.0
   - 项目备注：首次发布版本，包含核心记账功能
4. 点击"上传"

### 3. 提交审核
1. 登录小程序后台
2. 版本管理 > 开发版本
3. 找到刚上传的版本，点击"提交审核"
4. 填写审核信息：
   - 功能页面：选择主要功能页面
   - 功能描述：详细描述小程序功能
   - 测试账号：提供测试账号（如需要）

## 🔍 审核发布

### 1. 审核准备
- 确保小程序功能完整可用
- 准备详细的功能说明
- 确保符合微信小程序规范
- 准备客服联系方式

### 2. 审核时间
- 一般审核时间：1-7个工作日
- 可在小程序后台查看审核进度

### 3. 审核通过后发布
1. 收到审核通过通知
2. 登录小程序后台
3. 版本管理 > 线上版本
4. 点击"发布"按钮
5. 小程序正式上线

## 🖥 后端服务部署

### 1. 服务器准备
推荐配置：
- CPU：2核心以上
- 内存：4GB以上
- 存储：50GB以上SSD
- 带宽：5Mbps以上
- 操作系统：Ubuntu 20.04 LTS

### 2. 环境安装
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 安装Nginx
sudo apt install nginx -y

# 安装MySQL
sudo apt install mysql-server -y

# 安装Redis
sudo apt install redis-server -y
```

### 3. 部署后端API
```bash
# 克隆后端代码（需要单独开发）
git clone https://github.com/your-username/family-accounting-api.git
cd family-accounting-api

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库等信息

# 启动服务
pm2 start ecosystem.config.js --env production
```

### 4. 配置Nginx
```nginx
server {
    listen 80;
    server_name api.family-accounting.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# WebSocket服务
server {
    listen 80;
    server_name ws.family-accounting.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. 配置HTTPS
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取SSL证书
sudo certbot --nginx -d api.family-accounting.com
sudo certbot --nginx -d ws.family-accounting.com
```

## 🌐 域名配置

### 1. 购买域名
- 推荐平台：阿里云、腾讯云、GoDaddy
- 域名建议：family-accounting.com

### 2. DNS配置
```
A记录：
api.family-accounting.com -> 服务器IP
ws.family-accounting.com -> 服务器IP
cdn.family-accounting.com -> CDN地址

CNAME记录：
www.family-accounting.com -> family-accounting.com
```

### 3. CDN配置（可选）
- 使用阿里云CDN或腾讯云CDN
- 配置静态资源加速
- 配置图片处理服务

## 📊 监控配置

### 1. 应用监控
```bash
# 安装监控工具
npm install -g @sentry/cli

# 配置Sentry
# 在项目中集成错误监控
```

### 2. 服务器监控
```bash
# 安装监控代理
# 可使用阿里云监控、腾讯云监控等
```

### 3. 日志管理
```bash
# 配置日志轮转
sudo nano /etc/logrotate.d/family-accounting

# 内容：
/var/log/family-accounting/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

## 🔧 发布后维护

### 1. 版本更新流程
1. 开发新功能
2. 测试验证
3. 构建发布版本
4. 上传代码
5. 提交审核
6. 发布更新

### 2. 数据备份
```bash
# 数据库备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p family_accounting > /backup/db_$DATE.sql
```

### 3. 监控告警
- 设置服务器资源告警
- 设置应用错误告警
- 设置用户访问异常告警

### 4. 用户反馈处理
- 建立用户反馈渠道
- 定期收集用户意见
- 及时修复问题和优化功能

## 📞 技术支持

### 联系方式
- 技术支持邮箱：support@family-accounting.com
- 用户反馈QQ群：123456789
- 官方网站：https://family-accounting.com

### 常见问题
1. **小程序无法登录**
   - 检查网络连接
   - 确认服务器状态
   - 检查微信授权

2. **数据同步失败**
   - 检查WebSocket连接
   - 确认用户权限
   - 重启应用

3. **账单识别失败**
   - 检查图片清晰度
   - 确认OCR服务状态
   - 尝试重新上传

---

**祝您发布顺利！** 🎉

如有问题，请随时联系技术支持团队。
