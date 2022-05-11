import { StyleSheet } from 'react-native'
import Fonts from 'App/Theme/Fonts'
import ApplicationStyles from 'App/Theme/ApplicationStyles'
import { Metrics, Colors } from '../../Theme';

export default StyleSheet.create({
  ...ApplicationStyles,
  
  itemContainer: {
    ...ApplicationStyles.separator,
    flexDirection: "row",
    width: Metrics.clientWidth,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Metrics.baseMargin, 
    paddingVertical: Metrics.doubleBaseMargin, 
  },

  itemButton: {
    width: 100,
    height: (110 / 240) * 100,
  },

  itemText: {
    flex: 1,
    paddingHorizontal: Metrics.doubleBaseMargin,
    textAlign: "center",
  },

  bluetoothStatusContainer: { 
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.lightGrey,
  },

  iconConnectionOk: {
    color: Colors.bluetooth,
  },

  iconConnectionError: {
    color: Colors.error,
  },

  iconEdit: {
    color: Colors.green,
  },

})
