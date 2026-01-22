import ApplicationStyles from '@/App/Theme/ApplicationStyles';
import { StyleSheet } from 'react-native';
import { Fonts, Metrics } from '../../Theme';

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
