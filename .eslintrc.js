module.exports = {
  extends: [
    'taro/vue3'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es6: true,
    node: true
  },
  rules: {
    // 允许单词组件名（针对小程序页面组件）
    'vue/multi-word-component-names': 'off',

    // 关闭大部分严格规则，专注于关键错误
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // Vue 相关规则 - 只保留关键的
    'vue/no-unused-components': 'off',
    'vue/no-unused-vars': 'off',
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'off',
    'vue/no-parsing-error': 'off',
    'vue/no-template-key': 'off',

    // 通用规则 - 宽松设置
    'no-console': 'off',
    'no-debugger': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',

    // 关闭代码风格检查
    'indent': 'off',
    'quotes': 'off',
    'semi': 'off',
    'comma-dangle': 'off',
    'object-curly-spacing': 'off',
    'array-bracket-spacing': 'off',

    // 小程序特定规则 - 宽松设置
    'taro/this-props-function': 'off',
    'taro/no-stateless-component': 'off',
    'taro/jsx-handler-names': 'off'
  },
  globals: {
    // 小程序全局变量
    wx: 'readonly',
    App: 'readonly',
    Page: 'readonly',
    Component: 'readonly',
    getApp: 'readonly',
    getCurrentPages: 'readonly',
    
    // Taro 全局变量
    Taro: 'readonly',
    
    // 其他全局变量
    process: 'readonly',
    __DEV__: 'readonly'
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        // Vue 文件特定规则
        'vue/component-name-in-template-casing': ['error', 'kebab-case'],
        'vue/prop-name-casing': ['error', 'camelCase'],
        'vue/attribute-hyphenation': ['error', 'always']
      }
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // TypeScript 文件特定规则
        '@typescript-eslint/prefer-const': 'error',
        '@typescript-eslint/no-var-requires': 'error'
      }
    },
    {
      files: ['src/pages/**/index.vue'],
      rules: {
        // 页面组件允许使用 index 作为组件名
        'vue/multi-word-component-names': 'off'
      }
    }
  ]
};
