import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

// Styles
import { Metrics, Colors, Fonts } from '../Theme';

// Utils

// Redux

// Components
import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';

interface Props {
  title?: string,
  onOkPress?: (pinCode: string) => void,
}

const Keypad: FunctionComponent<Props> = ({
  title,
  onOkPress,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation()
  const [pinCode, setPinCode] = useState("")

  const onKeyButtonPress = (digit: string) => {
    setPinCode(pinCode + digit)
  }

  const onBackButtonPress = () => {
    setPinCode(pinCode.slice(0, -1))
  }

  const renderButton = (digit: string, onPress?: () => void) =>
    <Button
      key={digit}
      style={styles.squareButton} 
      size="big" 
      title={digit}
      onPress={onPress ? onPress : () => { onKeyButtonPress(digit) }}
    />

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.pinCode}>{pinCode}</Text>
      <View style={styles.buttonsContainer}>
        { ["1", "2", "3"].map((digit: string) => renderButton(digit)) }
      </View>
      <View style={styles.buttonsContainer}>
        { ["4", "5", "6"].map((digit: string) => renderButton(digit)) }
      </View>
      <View style={styles.buttonsContainer}>
        { ["7", "8", "9"].map((digit: string) => renderButton(digit)) }
      </View>
      <View style={styles.buttonsContainer}>
        { renderButton("OK", () => { onOkPress && onOkPress(pinCode) }) }
        { renderButton("0") }
        { renderButton("🔙", onBackButtonPress) }
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    ...Fonts.style.heading,
    alignSelf: "center",
    marginBottom: Metrics.doubleBaseMargin,
    color: Colors.white
  },

  pinCode: {
    ...Fonts.style.headingSmall,
    height: 30,
    letterSpacing: 10,
    alignSelf: "center",
    marginBottom: Metrics.doubleBaseMargin,
    color: Colors.white
  },

  buttonsContainer: {
    flexDirection: "row",
    alignSelf: "center",
  },

  squareButton: {
    width: Metrics.clientWidth / 4,
    height: Metrics.clientWidth / 4,
    margin: Metrics.baseMargin,
  },

  border: { 
    height: Metrics.baseMargin, 
    borderBottomWidth: 2,
    borderBottomColor: Colors.green,
  }
})

export default Keypad