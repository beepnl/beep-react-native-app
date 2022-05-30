import React, { FunctionComponent } from 'react'

// Hooks

// Styles
import { Metrics, Colors, Fonts, ApplicationStyles } from '../Theme';

// Utils

// Redux

// Components
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ScreenHeaderProps {
  title: string,
  subTitle?: string,
  showArrow?: boolean,
  disabled?: boolean,
  selected?: boolean,
  onPress?: () => void,
}

const NavigationButton: FunctionComponent<ScreenHeaderProps> = ({
  title,
  subTitle,
  showArrow = true,
  disabled = false,
  selected = false,
  onPress,
}) => {
  return (
    <TouchableOpacity key={title} style={styles.container} onPress={onPress} disabled={disabled} >
      <View>
        <Text style={[styles.title, selected && { color: Colors.yellow }]}>{title}</Text>
        { subTitle && <Text style={[styles.subTitle, selected && { color: Colors.yellow }]}>{subTitle}</Text> }
      </View>
      { showArrow && !disabled && <Icon name="chevron-right" size={30} color={Colors.lightGrey} /> }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    // height: Metrics.buttonHeight,
    alignItems: "center",
    justifyContent: "space-between",
    padding: Metrics.baseMargin,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },

  title: {
    ...ApplicationStyles.text
  },

  subTitle: {
    ...Fonts.style.small,
    fontStyle: "italic",
    color: Colors.darkGrey,
  },

})

export default NavigationButton