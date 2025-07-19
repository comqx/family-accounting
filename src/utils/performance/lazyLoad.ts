import { defineAsyncComponent } from 'vue'

// 懒加载组件配置
const lazyComponents = {
  // 报表相关组件
  'AdvancedReport': () => import('../../pages/reports/advanced/index.vue'),
  'ExportPage': () => import('../../pages/export/index.vue'),
  
  // 导入相关组件
  'ImportPage': () => import('../../pages/import/index.vue'),
  'ImportResult': () => import('../../pages/import/result/index.vue'),
  
  // 设置相关组件
  'SettingsPage': () => import('../../pages/settings/index.vue'),
  'ProfilePage': () => import('../../pages/profile/index.vue'),
  
  // 家庭管理相关组件
  'FamilyCreate': () => import('../../pages/family/create/index.vue'),
  'FamilyJoin': () => import('../../pages/family/join/index.vue'),
  'FamilySettings': () => import('../../pages/family/settings/index.vue'),
  'FamilyBudget': () => import('../../pages/family/budget/index.vue'),
  
  // 记录相关组件
  'RecordAdd': () => import('../../pages/record/add/index.vue'),
  'RecordEdit': () => import('../../pages/record/edit/index.vue'),
  'RecordDetail': () => import('../../pages/record/detail/index.vue'),
  
  // 分类管理组件
  'CategoryPage': () => import('../../pages/category/index.vue'),
  
  // 分摊相关组件
  'SplitPage': () => import('../../pages/split/index.vue'),
}

// 创建懒加载组件
export function createLazyComponent(name: keyof typeof lazyComponents) {
  return defineAsyncComponent({
    loader: lazyComponents[name],
    loadingComponent: {
      template: `
        <view class="lazy-loading">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
      `,
      styles: `
        .lazy-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40rpx;
          color: #999;
        }
        .loading-spinner {
          width: 40rpx;
          height: 40rpx;
          border: 4rpx solid #f3f3f3;
          border-top: 4rpx solid #1296db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20rpx;
        }
        .loading-text {
          font-size: 24rpx;
          color: #999;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `
    },
    errorComponent: {
      template: `
        <view class="lazy-error">
          <text class="error-icon">⚠️</text>
          <text class="error-text">加载失败</text>
          <button class="retry-btn" @tap="retry">重试</button>
        </view>
      `,
      methods: {
        retry() {
          // 重新加载组件
          this.$forceUpdate()
        }
      },
      styles: `
        .lazy-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40rpx;
          color: #ff4757;
        }
        .error-icon {
          font-size: 48rpx;
          margin-bottom: 20rpx;
        }
        .error-text {
          font-size: 28rpx;
          margin-bottom: 30rpx;
        }
        .retry-btn {
          background: #1296db;
          color: white;
          border: none;
          border-radius: 20rpx;
          padding: 16rpx 32rpx;
          font-size: 26rpx;
        }
      `
    },
    delay: 200, // 延迟显示加载组件
    timeout: 10000 // 超时时间
  })
}

// 预加载组件
export function preloadComponent(name: keyof typeof lazyComponents) {
  if (lazyComponents[name]) {
    lazyComponents[name]().catch(error => {
      console.warn(`预加载组件 ${name} 失败:`, error)
    })
  }
}

// 预加载多个组件
export function preloadComponents(names: (keyof typeof lazyComponents)[]) {
  names.forEach(name => preloadComponent(name))
}

// 预加载常用组件
export function preloadCommonComponents() {
  // 预加载用户可能经常访问的页面
  preloadComponents([
    'RecordAdd',
    'RecordDetail',
    'CategoryPage',
    'SettingsPage'
  ])
}

// 导出所有懒加载组件
export const LazyComponents = {
  AdvancedReport: createLazyComponent('AdvancedReport'),
  ExportPage: createLazyComponent('ExportPage'),
  ImportPage: createLazyComponent('ImportPage'),
  ImportResult: createLazyComponent('ImportResult'),
  SettingsPage: createLazyComponent('SettingsPage'),
  ProfilePage: createLazyComponent('ProfilePage'),
  FamilyCreate: createLazyComponent('FamilyCreate'),
  FamilyJoin: createLazyComponent('FamilyJoin'),
  FamilySettings: createLazyComponent('FamilySettings'),
  FamilyBudget: createLazyComponent('FamilyBudget'),
  RecordAdd: createLazyComponent('RecordAdd'),
  RecordEdit: createLazyComponent('RecordEdit'),
  RecordDetail: createLazyComponent('RecordDetail'),
  CategoryPage: createLazyComponent('CategoryPage'),
  SplitPage: createLazyComponent('SplitPage'),
}

export default LazyComponents 