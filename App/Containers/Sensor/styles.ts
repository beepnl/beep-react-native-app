import { StyleSheet } from 'react-native'
import Fonts from 'App/Theme/Fonts'
import ApplicationStyles from 'App/Theme/ApplicationStyles'
import { Metrics, Colors } from '../../Theme';

export default StyleSheet.create({
  ...ApplicationStyles,

  itemContainer: {
    padding: Metrics.baseMargin,
    borderRadius: Metrics.baseMargin,
    borderWidth: 1,
    borderColor: Colors.yellow,
    backgroundColor: Colors.lightYellow,
  },

  itemRow: {
    flexDirection: "row", 
    marginVertical: Metrics.halfBaseMargin,
    justifyContent: "space-between",
  },

  itemText: {
    ...ApplicationStyles.text,
    paddingHorizontal: Metrics.doubleBaseMargin,
    textAlign: "center",
  },

  footerContainer: {
    padding: Metrics.baseMargin,
    marginBottom: Metrics.baseMargin,
  },

})
