import React, { FunctionComponent } from 'react'
import { StyleSheet } from 'react-native';
import { Metrics, Colors, Fonts } from '../Theme';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CheckboxProps {
  title: string,
  onPress?: (isChecked?: boolean) => void
}

const Checkbox: FunctionComponent<CheckboxProps> = ({
  title,
  onPress,
}) => {
  return (
    <BouncyCheckbox
      size={Metrics.checkboxHeight}
      fillColor={Colors.orange}
      unfillColor={Colors.background}
      iconComponent={<Icon name={"check"} size={24} color={Colors.white} />}
      text={title}
      textStyle={{ color: Colors.text, textDecorationLine: "none" }}
      textContainerStyle={{ marginLeft: Metrics.baseMargin }}
      iconStyle={{ borderWidth: 2, borderRadius: Metrics.buttonRadius, borderColor: Colors.black }}
      bounceEffect={1}
      bounceFriction={6}
      onPress={onPress ? onPress : () => {}}
    />
  )
}

const styles = StyleSheet.create({
  button: {
    width: "80%",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Metrics.baseMargin,
    paddingHorizontal: Metrics.doubleBaseMargin,
    backgroundColor: Colors.orange,
    borderRadius: Metrics.buttonRadius,
  },

  title: {
    ...Fonts.style.button,
    paddingTop: 4,  //center vertically
    color: Colors.white
  },

})

export default Checkbox