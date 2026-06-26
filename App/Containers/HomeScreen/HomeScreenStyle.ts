import ApplicationStyles from '@/App/Theme/ApplicationStyles';
import { StyleSheet } from 'react-native';
import { Colors, Metrics } from '../../Theme';

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
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },

  availableBadge: {
    paddingHorizontal: Metrics.baseMargin,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.green,
  },

  availableBadgeText: {
    color: Colors.background,
    fontSize: 11,
    fontWeight: '700',
  },

  bleOnlyPanel: {
    width: '100%',
    padding: Metrics.doubleBaseMargin,
    backgroundColor: Colors.silver,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },

  bleOnlyText: {
    ...ApplicationStyles.text,
    color: Colors.darkGrey,
    marginBottom: Metrics.baseMargin,
  },

  bleOnlyButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Metrics.doubleBaseMargin,
    paddingVertical: Metrics.baseMargin,
    borderRadius: 8,
    backgroundColor: Colors.yellow,
  },

  bleOnlyButtonText: {
    ...ApplicationStyles.text,
    fontWeight: '700',
  },

})
