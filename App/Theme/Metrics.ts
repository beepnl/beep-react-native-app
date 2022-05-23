import {Dimensions, Platform} from 'react-native'

const { width, height } = Dimensions.get('window')
const baseMargin = 8
const screenWidth = width < height ? width : height
const clientWidth = screenWidth - baseMargin - baseMargin
const screenHeight = width < height ? height : width
const metrics = {
  marginHorizontal: baseMargin,
  marginVertical: baseMargin,
  halfBaseMargin: baseMargin / 2,
  baseMargin,
  doubleBaseMargin: baseMargin * 2,
  section: 25,
  doubleSection: 50,
  horizontalLineHeight: 1,
  screenWidth,
  clientWidth,
  screenHeight,
  isSmallScreen: screenWidth < 350,
  isBigScreen: screenWidth >= 350,
  navBarHeight: 54,
  inputHeight: 60,
  buttonHeight: 60,
  buttonRadius: 6,
  cardRadius: 12,
  checkboxHeight: 30,
}

export default metrics
