export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/ledger/index',
    'pages/reports/index',
    'pages/family/index',
    'pages/profile/index',
    'pages/login/index',
    'pages/record/add/index',
    'pages/record/detail/index',
    'pages/record/edit/index',
    'pages/category/index',
    'pages/category/add/index',
    'pages/family/create/index',
    'pages/family/join/index',
    'pages/family/members/index',
    'pages/import/index',
    'pages/import/result/index',
    'pages/settings/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '家账通',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f5f5'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#1296db',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '记账',
        iconPath: 'assets/icons/record.png',
        selectedIconPath: 'assets/icons/record-active.png'
      },
      {
        pagePath: 'pages/ledger/index',
        text: '账本',
        iconPath: 'assets/icons/ledger.png',
        selectedIconPath: 'assets/icons/ledger-active.png'
      },
      {
        pagePath: 'pages/reports/index',
        text: '报表',
        iconPath: 'assets/icons/report.png',
        selectedIconPath: 'assets/icons/report-active.png'
      },
      {
        pagePath: 'pages/family/index',
        text: '家庭',
        iconPath: 'assets/icons/family.png',
        selectedIconPath: 'assets/icons/family-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png'
      }
    ]
  },
  requiredPrivateInfos: [
    'getLocation'
  ],
  permission: {
    'scope.userLocation': {
      desc: '用于记录消费地点信息'
    }
  },
  requiredBackgroundModes: ['audio']
})
