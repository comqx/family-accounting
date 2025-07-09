// babel-preset-taro 更多选项和默认值：
// https://docs.taro.zone/docs/next/babel-config
module.exports = {
  presets: [
    ['taro', {
      framework: 'vue3',
      ts: true,
      compiler: 'webpack5',
    }]
  ],
  plugins: [
    // 确保兼容性
    '@babel/plugin-transform-typescript',
    // 处理可选链操作符
    '@babel/plugin-transform-optional-chaining',
    // 处理空值合并操作符
    '@babel/plugin-transform-nullish-coalescing-operator'
  ]
}
