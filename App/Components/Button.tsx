import React, { FunctionComponent, useState } from 'react'
import { StyleSheet, Text, View, ViewStyle, TouchableWithoutFeedback, StyleProp } from 'react-native';
import { Colors, Fonts } from '../Theme';
import ImageBigShadow from 'App/Assets/Images/BigShadow'
import ImageSmallShadow from 'App/Assets/Images/SmallShadow'
import ImageSmallShadowVertical from 'App/Assets/Images/SmallShadowVertical'
import ImageBigButton from 'App/Assets/Images/BigButton'
import ImageSmallButton from 'App/Assets/Images/SmallButton'
import ImageSmallButtonVertical from 'App/Assets/Images/SmallButtonVertical'

export interface ButtonProps {
  style?: StyleProp<ViewStyle>,
  size: "big" | "small",
  orientation?: "horizontal" | "vertical",
  state?: "up" | "down",
  title?: string,
  image?: JSX.Element,
  onPress?: () => void,
  onPressIn?: () => void,
  onPressOut?: () => void,
  disabled?: boolean,
  shadow?: boolean,
}

const Button: FunctionComponent<ButtonProps> = ({
  style = { width: 230, height: 90 },
  size,
  orientation,
  state,
  title,
  image,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  shadow = true,
}) => {
  const [pressedState, setPressedState] = useState(state || "up")
  
  function isDown(): boolean {
    if (state) {
      return state == "down"
    }
    return pressedState == "down"
  }
  
  let { width, height } = style
  let shadowWidth = style?.width || 230
  let shadowHeight = style?.height || 90
  width -= 10
  height -= 10
  const depth = height / 20
  if (isDown()) {
    width -= depth
    height -= depth
    shadowWidth -= depth / 2
    shadowHeight -= depth / 2
  }
  const ImageShadow = size == "big" ? ImageBigShadow : orientation == "vertical" ? ImageSmallShadowVertical : ImageSmallShadow
  const ImageBackground = size == "big" ? ImageBigButton : orientation == "vertical" ? ImageSmallButtonVertical : ImageSmallButton
  const ImageForeground = image

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      disabled={disabled}
      delayPressIn={0}
      delayPressOut={0}
      delayLongPress={60000}
      onPressIn={() => {
        if (!state) {
          setPressedState("down")
        }
        onPressIn && onPressIn()
      }}
      onPressOut={() => {
        if (!state) {
          setPressedState("up")
        }
        onPressOut && onPressOut()
      }}
    >
      <View style={[styles.container, style]}>
        { shadow &&
          <ImageShadow width={shadowWidth} height={shadowHeight} />
        }

        <View style={styles.overlayContainer}>
          <ImageBackground width={width} height={height} state={state || pressedState}/>
        </View>

        { !!image &&
          <View style={styles.overlayContainer}>
            <ImageForeground width={width} height={height} state={state || pressedState}/>
          </View>
        }

        { title != undefined &&
          <View style={styles.overlayContainer}>
            <Text style={[styles.title, isDown() && { color: Colors.white }]}>{title}</Text>
          </View>
        }
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.transparent,
  },

  overlayContainer: {
    position: 'absolute', 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingBottom: 5,       //vertical offset from center for bottom shadow
  },

  title: {
    ...Fonts.style.heading,
    fontSize: 20,
    color: Colors.grey,
  }
})

export default Button