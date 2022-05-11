import { StyleSheet } from 'react-native'
import Fonts from 'App/Theme/Fonts'
import ApplicationStyles from 'App/Theme/ApplicationStyles'
import { Metrics, Colors } from '../../Theme';

export default StyleSheet.create({
  ...ApplicationStyles,
  
  messageContainer: {
    flexDirection: "row",
    marginHorizontal: Metrics.baseMargin,
    alignItems: "center",
    justifyContent: "center",
  },

  itemContainer: {
    ...ApplicationStyles.separator,
    width: Metrics.clientWidth,
    marginHorizontal: Metrics.baseMargin,
    marginVertical: Metrics.baseMargin,
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemText: {
    flex: 1,
    paddingHorizontal: Metrics.doubleBaseMargin,
    textAlign: "center",
  },


})
