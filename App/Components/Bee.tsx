import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks

// Styles
import { Metrics, Colors, Fonts } from '../Theme';

// Utils

// Redux

// Components
import { StyleSheet, StatusBar, Text, View, ViewStyle, Animated } from 'react-native';
import Bee from '../Assets/Images/bee';

interface ScreenHeaderProps {
  style: ViewStyle,
  size: number,
  width: number,
}

const ScreenHeader: FunctionComponent<ScreenHeaderProps> = ({
  style,
  size,
  width,
}) => {
  const deg2rad = (degrees: number) => degrees / (180 / Math.PI)

  const angleVariance = (Math.random() * 80) - 40
  const angle = deg2rad(angleVariance)
  const height = width * Math.tan(angle)
  const animatedValue = useRef<Animated.Value>(new Animated.Value(0))
  let ANIMATION_DURATION = 5000 + (Math.random() * 2000)
  Animated.loop(
    Animated.sequence([
      Animated.delay(Math.random() * ANIMATION_DURATION),
      Animated.timing(animatedValue.current, { toValue: 1, duration: ANIMATION_DURATION, useNativeDriver: true }),
    ])
  ).start()

  return (
    <Animated.View style={
      { transform: [
        {
          translateX: animatedValue.current.interpolate({inputRange: [0, 1], outputRange: [-size, width + size]}),
        },
        {
          translateY: animatedValue.current.interpolate({inputRange: [0, 1], outputRange: [0, height]})
        },
        // { scale: animatedValue.current.interpolate({inputRange: [0, 1], outputRange: [0.8, 1.2]}) },
      ]}
    }>
      <Bee
        style={[ style,
        { 
          width: size, 
          height: size,
          transform: [{ rotate: `${45 + angleVariance}deg` }],
        }]}
        width={size}
        height={size}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
  },
})

export default ScreenHeader