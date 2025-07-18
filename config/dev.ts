import type { UserConfigExport } from "@tarojs/cli"

export default {
   logger: {
    quiet: false,
    stats: true
  },
  mini: {
    esnextModules: [
      'taro-virtual-list',
      'taro-echarts'
    ]
  } as any,
  h5: {}
} satisfies UserConfigExport<'webpack5'>
