import { StyleSheet } from 'react-native'
import Fonts from 'App/Theme/Fonts'
import ApplicationStyles from 'App/Theme/ApplicationStyles'
import { Metrics, Colors } from '../../Theme';

export default StyleSheet.create({
  ...ApplicationStyles,

  itemContainer: {
    // ...ApplicationStyles.separator,
    width: Metrics.clientWidth,
    marginHorizontal: Metrics.baseMargin,
    marginVertical: Metrics.baseMargin,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemText: {
    ...ApplicationStyles.text,
    paddingHorizontal: Metrics.doubleBaseMargin,
    textAlign: "center",
  },


})
