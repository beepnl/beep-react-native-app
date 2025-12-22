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
  },

  noticeContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Metrics.doubleBaseMargin,
    paddingVertical: Metrics.baseMargin,
    backgroundColor: Colors.lightYellow,
    borderLeftWidth: 3,
    borderLeftColor: Colors.darkYellow,
    borderRadius: 8,
    marginBottom: Metrics.baseMargin,
  },
  noticeText: {
    flex: 1,
    color: Colors.grey,
    fontSize: 13,
    lineHeight: 18,
  }

})
