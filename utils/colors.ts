import lightTokensRaw from './Light.tokens.json'
import darkTokensRaw from './Dark.tokens.json'

const lightTokens: any = lightTokensRaw
const darkTokens: any = darkTokensRaw

export const palette = {
  white: '#ffffff',
  black:"#000000",
  roleCardbg:"#FFFBEB",
  roleCard:"#EBFFEE",
  roleBulbColor1:"#975102",
  roleBulbColor2:"#008043",
  roleBulbColor3:"#E5A000",
  roleBulbColor4:"#009951",
  logoutColor:"#EC221F",
  logoutIconBg:"#EC221F12",
  editColor:"#F54900",
  profileAvatarBg: "#1A202C",
  settingsIconBg:"#F3F4F6"  , //setting and edit profile icon bg 
  liveTextbg:"#EBFFEE" ,
  locationIcon:"#975102" ,
  timeIconBg:"#ECF7FD" ,
  timeIcon:"#1DA1F2" ,
  glutenColor:"#FEE6854D"  ,
  glutenBorder:"#FFFFFF33",
  timerIconColor:"#757575",
  editProfileIconBg:"#0C0C0D08",
  largeFontbutton:"#8C9198",
  /** Bottom tab bar: very transparent white + blur */
  tabBarBg: '#FFFFFF03',
  ThreelinesIconBg:"#DCFCE7",
  
  notificationFreshBg: '#61856F1A',
  premiumBadge: '#33299F',
  kingIconColor: '#23A6F7',
  diamondIconColor: '#9061F9',
  basicIconColor: '#FFD700',
  restorePurchasesColor: '#1083FD',
  highPriorityBg: '#FEE9E7',
  greenTickColor: '#009951',
  
} as const

export const lightColors = {
  background: lightTokens.Surface.Surface.$value.hex,
  text: lightTokens['Text & Icons'].Default.$value.hex,
  textSecondary: lightTokens['Text & Icons'].Secondary.$value.hex,
  surface: lightTokens.Surface.Surface.$value.hex,
  surfaceBorder: lightTokens.Surface.Disabled.$value.hex,
  border: lightTokens.Surface.Disabled.$value.hex,
  primary: '#52976D',
  exclamatoryBg: lightTokens.Info['Info Container'].$value.hex,
  inputFieldBg: '#FFFFFF',
  borderColor: '#0C0C0D1A',
  partnerColor: '#000000',
  activeTabBg: '#ECEEF2',
  glutenBorder: '#0C0C0D33',
  locationIconColor: '#E5A000',
  requestBtnBg: '#E6E6E6',
  notificationBg: '#dae2db',
  
} as const

export const darkColors = {
  background: darkTokens.Surface.Surface.$value.hex,
  text: darkTokens['Text & Icons'].Default.$value.hex,
  textSecondary: darkTokens['Text & Icons'].Secondary.$value.hex,
  surface: darkTokens.Surface.Surface.$value.hex,
  surfaceBorder: darkTokens.Surface.Disabled.$value.hex,
  border: darkTokens.Surface.Disabled.$value.hex,
  primary: '#52976D',
  exclamatoryBg: darkTokens.Info['Info Container'].$value.hex,
  inputFieldBg: '#FFFFFF1A',
  borderColor: '#FFFFFF66',
  partnerColor: 'white',
  activeTabBg: '#ECEEF2',
  glutenBorder: '#FFFFFF33',
  requestBtnBg: '#424b54',
  notificationBg: '#2c3e40',
  notificationFreshBg: '#3c534e',
  
} as const

export type AppColors = {
  background: string
  text: string
  textSecondary: string
  surface: string
  surfaceBorder: string
  border: string
  primary: string
  exclamatoryBg: string
  inputFieldBg: string
  borderColor: string
  partnerColor: string
  activeTabBg: string
  glutenBorder: string
  requestBtnBg: string
  notificationBg: string
  
}

export function getColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors
}
