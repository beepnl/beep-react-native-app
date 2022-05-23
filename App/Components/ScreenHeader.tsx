import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

// Styles
import { Metrics, Colors, Fonts } from '../Theme';

// Utils
import AnimateDown from 'App/Helpers/MenuRenderer'

// Redux

// Components
import { StyleSheet, StatusBar, Text, View, TouchableOpacity } from 'react-native';
import Back from 'App/Assets/Images/Back'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
  title: string,
  back?: boolean,
  onBackPress?: () => void,
}

const ScreenHeader: FunctionComponent<ScreenHeaderProps> = ({
  title,
  back,
  onBackPress,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation()
  
  const onBackPressInternal = () => {
    navigation.goBack()
    onBackPress && onBackPress()
  }

  return (
    <SafeAreaView style={{ backgroundColor: Colors.yellow }} edges={["top"]}>
      <View style={styles.container}>
      <StatusBar backgroundColor={Colors.statusBar} barStyle="light-content"/>

      <TouchableOpacity style={styles.back} onPress={onBackPressInternal}>
        { !!back &&
          <Back />
        }
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <Menu renderer={AnimateDown} >
        <MenuTrigger style={styles.menuTrigger}>
          <Icon name="dots-vertical" size={30} color={Colors.black} />
        </MenuTrigger>
        <MenuOptions style={{ }}>
          <MenuOption customStyles={{ optionWrapper: styles.menuItemWrapper }} onSelect={() => {  }} >
            <Text style={styles.menuItem}>{t("menu.itemSettings")}</Text>
          </MenuOption>
        </MenuOptions>
      </Menu>
        </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    height: Metrics.navBarHeight,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: 'space-between',
    backgroundColor: Colors.yellow,
  },

  back: {
    paddingHorizontal: Metrics.doubleBaseMargin,
    paddingVertical: Metrics.baseMargin,
  },

  title: {
    ...Fonts.style.heading,
    alignSelf: "center",
    paddingTop: 3,
    marginBottom: 7,
    color: Colors.text
  },

  menuTrigger: { 
    width: Metrics.navBarHeight, 
    height: Metrics.navBarHeight, 
    alignItems: "center",
    justifyContent: "center" 
  },

  menuItemWrapper: {
    height: Metrics.buttonHeight,
    alignItems: "flex-end",
    justifyContent: "center",
    backgroundColor: Colors.yellow,
  },

  menuItem: {
    ...Fonts.style.big,
    marginHorizontal: Metrics.doubleBaseMargin,
    color: Colors.text,
  },

})

export default ScreenHeader