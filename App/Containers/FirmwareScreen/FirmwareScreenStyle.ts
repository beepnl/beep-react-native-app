import { StyleSheet } from 'react-native'
import ApplicationStyles from 'App/Theme/ApplicationStyles'
import { Metrics, Colors } from '../../Theme';

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

  orientationButton: {
    flexDirection: "row",
    height: Metrics.buttonHeight,
    alignItems: "center",
    justifyContent: "space-between",
    padding: Metrics.baseMargin,
    color: Colors.white,
  },

  orientationButtonButton: {
    width: 100,
    height: (110 / 240) * 100,
  },

  orientationButtonLabel: {
    flex: 1,
    paddingHorizontal: Metrics.doubleBaseMargin,
    textAlign: "center",
    color: Colors.white,
  },

  orientationButtonRadioIcon: {
    color: Colors.white,
  },

})
