import { Metrics } from '@/App/Theme';
import ApplicationStyles from '@/App/Theme/ApplicationStyles';
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  ...ApplicationStyles,

  itemCenteredContainer: {
    // width: Metrics.clientWidth,
    marginHorizontal: Metrics.baseMargin,
    marginVertical: Metrics.baseMargin,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemContainer: {
    // width: Metrics.clientWidth,
    marginHorizontal: Metrics.baseMargin,
    marginVertical: Metrics.baseMargin,
    // alignSelf: "center",
    // alignItems: "center",
    // justifyContent: "space-between",
  },

  itemText: {
    ...ApplicationStyles.text,
    paddingHorizontal: Metrics.doubleBaseMargin,
    textAlign: "center",
  },


})
