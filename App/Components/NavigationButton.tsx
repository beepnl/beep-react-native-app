import React, { FunctionComponent } from 'react'

// Hooks

// Styles
import { Metrics, Colors, Fonts, ApplicationStyles } from '../Theme';

// Utils

// Redux

// Components
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import IconMaterialCommunity from 'react-native-vector-icons/MaterialCommunityIcons';

interface ScreenHeaderProps {
  title: string,
  subTitle?: string,
  showArrow?: boolean,
  disabled?: boolean,
  selected?: boolean,
  Icon?: React.ComponentType<any> | React.ReactElement<any> | null,
  onPress?: () => void,
}

const NavigationButton: FunctionComponent<ScreenHeaderProps> = ({
  title,
  subTitle,
  showArrow = true,
  disabled = false,
  selected = false,
  Icon,
  onPress,
}) => {

  const renderIcon = () => {
    if (Icon) {
      const icon = React.isValidElement(Icon) ? (Icon) : (<Icon />)
      return icon
    }
    return <View style={ApplicationStyles.spacer} />
  }

  return (
    <TouchableOpacity key={title} style={styles.container} onPress={onPress} disabled={disabled} >
      <View style={{ flexDirection: "row" }}>
        <View style={ApplicationStyles.spacerHalf} />
        { renderIcon() }
        <View style={ApplicationStyles.spacer} />
        <View>
          <Text style={[styles.title, selected && { color: Colors.yellow }]}>{title}</Text>
          { subTitle && <Text style={[styles.subTitle, selected && { color: Colors.yellow }]}>{subTitle}</Text> }
        </View>
      </View>
      { showArrow && !disabled && <IconMaterialCommunity name="chevron-right" size={30} color={Colors.lightGrey} /> }
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
    paddingVertical: Metrics.baseMargin,
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