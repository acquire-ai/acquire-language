export default {
  plugins: {
    tailwindcss: {},
    'postcss-rem-to-responsive-pixel': {
      rootValue: 16,
      unitPrecision: 5,
      propList: ['*'],
      selectorBlackList: [],
      replace: true,
      mediaQuery: true,
      minRemValue: 0,
      transformUnit: 'px'  // 关键：输出为 px
    },
    autoprefixer: {},
  },
} 