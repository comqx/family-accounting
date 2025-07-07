// Pinia状态管理配置

import { createPinia } from 'pinia';

// 创建pinia实例
const pinia = createPinia();

export default pinia;

// 导出所有store
export { useUserStore } from './modules/user';
export { useFamilyStore } from './modules/family';
export { useRecordStore } from './modules/record';
export { useCategoryStore } from './modules/category';
export { useAppStore } from './modules/app';
