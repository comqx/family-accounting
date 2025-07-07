# 微信小程序权限配置指南

## 🔍 问题说明

遇到的错误：
```
无效的 app.json permission["scope.userInfo"]
无效的 app.json permission["scope.camera"] 
无效的 app.json permission["scope.album"]
```

## 📋 权限配置规范

### 1. 已废弃的权限
以下权限在新版本微信小程序中已经废弃或调整：

- ❌ `scope.userInfo` - 已废弃，现在通过 `wx.getUserProfile` 获取
- ❌ `scope.camera` - 不需要在 app.json 中声明
- ❌ `scope.album` - 不需要在 app.json 中声明

### 2. 正确的权限配置

#### requiredPrivateInfos（隐私接口声明）
```typescript
// 有效的隐私接口列表（根据微信官方文档）
requiredPrivateInfos: [
  'chooseAddress',    // 选择地址
  'chooseLocation',   // 选择位置
  'choosePoi',        // 选择POI
  'getFuzzyLocation', // 获取模糊位置
  'getLocation',      // 获取精确位置
  'onLocationChange', // 监听位置变化
  'startLocationUpdate',           // 开始位置更新
  'startLocationUpdateBackground'  // 后台位置更新
]
```

**注意**: `chooseImage`、`startRecord`、`saveImageToPhotosAlbum` 等不在隐私接口列表中，无需声明。

#### permission（用户授权说明）
```typescript
permission: {
  'scope.userLocation': {
    desc: '用于记录消费地点信息'
  },
  'scope.writePhotosAlbum': {
    desc: '用于保存账单图片到相册'
  },
  'scope.record': {
    desc: '用于语音记账功能'
  }
}
```

## 🛠 修复后的配置

### app.config.ts 完整配置
```typescript
export default defineAppConfig({
  pages: [
    // ... 页面配置
  ],
  tabBar: {
    // ... 底部导航配置
  },
  // 隐私接口声明（仅在使用位置相关功能时需要）
  requiredPrivateInfos: [
    'getLocation'
  ],
  // 用户授权说明
  permission: {
    'scope.userLocation': {
      desc: '用于记录消费地点信息'
    }
  },
  // 后台运行模式
  requiredBackgroundModes: ['audio'],
  // 窗口配置
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '家账通',
    navigationBarTextStyle: 'black'
  }
})
```

## 📱 权限使用说明

### 1. 图片选择权限
```javascript
// 图片选择不需要在 requiredPrivateInfos 中声明
// 也不需要预先申请权限，直接调用即可
Taro.chooseImage({
  count: 1,
  sizeType: ['compressed'],
  sourceType: ['camera', 'album'],
  success: (res) => {
    // 处理选择的图片
    console.log('选择的图片:', res.tempFilePaths);
  },
  fail: (err) => {
    console.error('选择图片失败:', err);
  }
})
```

**重要说明**:
- `chooseImage` 不属于隐私接口，无需在 `requiredPrivateInfos` 中声明
- 用户首次使用时，微信会自动弹出权限申请弹窗
- 如果用户拒绝权限，可以引导用户到设置页面开启

### 2. 用户信息获取
```javascript
// 新版本使用 getUserProfile
Taro.getUserProfile({
  desc: '用于完善用户资料',
  success: (res) => {
    // 获取用户信息
  }
})
```

### 3. 位置权限
```javascript
// 获取当前位置
Taro.getLocation({
  type: 'gcj02',
  success: (res) => {
    // 处理位置信息
  },
  fail: () => {
    // 权限被拒绝的处理
  }
})
```

## 🔐 隐私政策配置

### 1. 小程序后台配置
在微信小程序后台需要配置隐私政策：

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入小程序后台
3. 设置 > 基本设置 > 隐私设置
4. 配置隐私政策链接

### 2. 隐私政策内容
需要说明以下内容：
- 收集的用户信息类型
- 信息使用目的
- 信息存储和保护措施
- 用户权利说明

### 3. 隐私弹窗处理
```javascript
// 在 app.ts 中处理隐私弹窗
Taro.onNeedPrivacyAuthorization((resolve) => {
  // 弹出隐私协议弹窗
  Taro.showModal({
    title: '隐私授权',
    content: '请您确认同意隐私政策后继续使用',
    confirmText: '同意',
    cancelText: '拒绝',
    success: (res) => {
      if (res.confirm) {
        resolve({ agree: true })
      } else {
        resolve({ agree: false })
      }
    }
  })
})
```

## ⚠️ 注意事项

### 1. 权限申请时机
- 在用户需要使用功能时再申请权限
- 提供清晰的权限说明
- 处理用户拒绝权限的情况

### 2. 隐私合规
- 必须配置隐私政策
- 收集的信息要有明确用途
- 遵守相关法律法规

### 3. 审核要求
- 权限使用要与功能匹配
- 不能申请不必要的权限
- 隐私政策要真实有效

## 🔧 常见问题解决

### Q1: chooseImage 不需要权限声明吗？
A: 在 `requiredPrivateInfos` 中声明即可，不需要在 `permission` 中声明。

### Q2: 如何处理用户拒绝权限？
A: 提供友好的提示，引导用户到设置页面开启权限。

```javascript
const handlePermissionDenied = () => {
  Taro.showModal({
    title: '权限申请',
    content: '需要相机权限来拍摄账单，请在设置中开启',
    confirmText: '去设置',
    success: (res) => {
      if (res.confirm) {
        Taro.openSetting()
      }
    }
  })
}
```

### Q3: 隐私政策链接要求？
A: 必须是 HTTPS 链接，内容要真实有效，符合法律要求。

## 📋 检查清单

发布前请确认：
- [ ] 移除了废弃的权限配置
- [ ] 正确配置了 `requiredPrivateInfos`
- [ ] 权限说明文案清晰易懂
- [ ] 配置了隐私政策链接
- [ ] 处理了隐私授权弹窗
- [ ] 测试了权限申请流程
- [ ] 处理了权限被拒绝的情况

## 🚀 更新后的效果

修复后的配置将：
- ✅ 通过微信小程序审核
- ✅ 正确申请必要权限
- ✅ 符合隐私合规要求
- ✅ 提供良好的用户体验

---

**注意**: 微信小程序的权限政策会不断更新，请关注官方文档的最新变化。
