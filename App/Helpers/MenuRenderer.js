import React from 'react';
import { I18nManager, Animated, Easing, StyleSheet, PixelRatio } from 'react-native';
import { Metrics } from '../Theme';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

const OPEN_ANIM_DURATION = 300;
const CLOSE_ANIM_DURATION = 200;
const USE_NATIVE_DRIVER = true;

const axisPosition = (oDim, wDim, tPos, tDim) => {
  // if options are bigger than window dimension, then render at 0
  if (oDim > wDim) {
    return 0;
  }
  // render at trigger position if possible
  if (tPos + oDim <= wDim) {
    return tPos;
  }
  // aligned to the trigger from the bottom (right)
  if (tPos + tDim - oDim >= 0) {
    return tPos + tDim - oDim;
  }
  // compute center position
  let pos = Math.round(tPos + (tDim / 2) - (oDim / 2));
  // check top boundary
  if (pos < 0) {
    return 0;
  }
  // check bottom boundary
  if (pos + oDim > wDim) {
    return wDim - oDim;
  }
  // if everything ok, render in center position
  return pos;
};

function fit(pos, len, minPos, maxPos) {
  if (pos === undefined) {
    return undefined;
  }
  if (pos + len > maxPos) {
    pos = maxPos - len;
  }
  if (pos < minPos) {
    pos = minPos;
  }
  return pos;
}
// fits options (position) into safeArea
export const fitPositionIntoSafeArea = (position, layouts) => {
  const { windowLayout, safeAreaLayout, optionsLayout } = layouts;
  if (!safeAreaLayout) {
    return position;
  }
  const { x: saX, y: saY, height: saHeight, width: saWidth } = safeAreaLayout;
  const { height: oHeight, width: oWidth } = optionsLayout;
  const { width: wWidth } = windowLayout;
  let { top, left, right } = position;
  top = fit(top, oHeight, saY, saY + saHeight);
  left = fit(left, oWidth, saX, saX + saWidth)
  right = fit(right, oWidth, wWidth - saX - saWidth, saX)
  return { top, left, right };
}

export const computePosition = (layouts, isRTL) => {
  const { windowLayout, triggerLayout, optionsLayout } = layouts;
  const { x: wX, y: wY, width: wWidth, height: wHeight } = windowLayout;
  const { x: tX, y: tY, height: tHeight, width: tWidth } = triggerLayout;
  const { height: oHeight, width: oWidth } = optionsLayout;
  const top = axisPosition(oHeight, wHeight, tY - wY, tHeight);
  const left = axisPosition(oWidth, wWidth, tX - wX, tWidth);
  const start = isRTL ? 'right' : 'left';
  const position = { top, [start]: left };
  return fitPositionIntoSafeArea(position, layouts);
};

class AnimateDown extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      slideAnim: new Animated.Value(0),
    };
  }

  componentDidMount() {
    Animated.timing(this.state.slideAnim, {
      duration: OPEN_ANIM_DURATION,
      toValue: 1,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }

  close() {
    return new Promise(resolve => {
      Animated.timing(this.state.slideAnim, {
        duration: CLOSE_ANIM_DURATION,
        toValue: 0,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(resolve);
    });
  }

  render() {
    const { style, children, layouts, ...other } = this.props;
    const { height, y } = layouts.triggerLayout;
    const { height: oHeight } = layouts.optionsLayout;
    const animation = {
      transform: [{
        translateY: this.state.slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [y + height - oHeight, y],
        }),
      }],
      opacity: this.state.slideAnim
    };
    const position = computePosition(layouts, I18nManager.isRTL);

    return (
      <Animated.View {...other} style={[styles.options, { marginTop: Metrics.navBarHeight - this.props.insets.top }, style, animation, position]}>
        {children}
      </Animated.View>
    );
  }

}

export default withSafeAreaInsets(AnimateDown)

// public exports
AnimateDown.computePosition = computePosition;
AnimateDown.fitPositionIntoSafeArea = fitPositionIntoSafeArea;

export const styles = StyleSheet.create({
  options: {
    position: 'absolute',
    borderRadius: 2,
    // backgroundColor: 'white',
    // width: PixelRatio.roundToNearestPixel(260),

    // Shadow only works on iOS.
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 4,

    // This will elevate the view on Android, causing shadow to be drawn.
    elevation: 5,
  },
});
