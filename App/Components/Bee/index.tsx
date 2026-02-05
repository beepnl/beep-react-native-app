import React, { FunctionComponent, useRef, useEffect } from 'react';

// Hooks

// Styles

// Utils

// Redux

// Components
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import Bee from './image';

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
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)
  const ANIMATION_DURATION = useRef(5000 + (Math.random() * 2000))

  useEffect(() => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(Math.random() * ANIMATION_DURATION.current),
        Animated.timing(animatedValue.current, { toValue: 1, duration: ANIMATION_DURATION.current, useNativeDriver: true }),
        Animated.timing(animatedValue.current, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    )
    animationRef.current.start()

    return () => {
      if (animationRef.current) {
        animationRef.current.stop()
      }
    }
  }, [])

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