import { StyleSheet } from 'react-native'
import ApplicationStyles from 'App/Theme/ApplicationStyles'
import { Metrics, Colors, Fonts } from '../../Theme';

export default StyleSheet.create({
  ...ApplicationStyles,
  
  itemContainer: {
    flexDirection: "row",
    width: Metrics.clientWidth,
    marginHorizontal: Metrics.baseMargin,
    marginVertical: Metrics.baseMargin,
    alignItems: "center",
    justifyContent: "space-between",
  },


  menuItemTitle: {
    ...Fonts.style.button
  },

})
