import { StyleSheet } from 'react-native'
import Fonts from 'App/Theme/Fonts'
import ApplicationStyles from 'App/Theme/ApplicationStyles'
import { Metrics, Colors } from '../../Theme';

export default StyleSheet.create({
  ...ApplicationStyles,

  itemContainer: {
    marginHorizontal: Metrics.baseMargin,
    marginVertical: Metrics.baseMargin,
    alignItems: "center",
  },

  itemText: {
    ...ApplicationStyles.text,
    paddingHorizontal: Metrics.doubleBaseMargin,
    textAlign: "center",
  },

})
