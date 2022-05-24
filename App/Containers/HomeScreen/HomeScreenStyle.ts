import { StyleSheet } from 'react-native'
import Fonts from 'App/Theme/Fonts'
import ApplicationStyles from 'App/Theme/ApplicationStyles'
import { Metrics, Colors } from '../../Theme';

export default StyleSheet.create({
  ...ApplicationStyles,

  container: {
    ...ApplicationStyles.container,
    alignItems: "center",
  },

  devicesContainer: {
    ...ApplicationStyles.container,
    width: "100%",
  }

})
