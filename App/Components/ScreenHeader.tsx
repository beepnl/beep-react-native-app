import React, { FunctionComponent } from 'react';

// Hooks
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

// Styles
import { Colors, Fonts, Metrics } from '../Theme';

// Utils
import AnimateDown from '@/App/Helpers/MenuRenderer';

// Redux

// Components
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger
} from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ScreenHeaderProps {
  title: string,
  back?: boolean,
  menu?: boolean,
  onBackPress?: () => void,
}

const ScreenHeader: FunctionComponent<ScreenHeaderProps> = ({
  title,
  back,
  menu,
  onBackPress,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation()
  
  const onBackPressInternal = () => {
    navigation.goBack()
    onBackPress && onBackPress()
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={onBackPressInternal} disabled={!back} >
        <Icon name="chevron-left" size={30} color={back ? Colors.black : Colors.transparent} />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <Menu renderer={AnimateDown} >
        <MenuTrigger style={[styles.menuTrigger, !menu && { opacity: 0 }]} disabled={!menu} >
          <Icon name="dots-vertical" size={30} color={Colors.black} />
        </MenuTrigger>
        <MenuOptions style={{ }}>
          <MenuOption customStyles={{ optionWrapper: styles.menuItemWrapper }} onSelect={() => { navigation.navigate("SettingsScreen") }} >
            <Text style={styles.menuItem}>{t("menu.itemSettings")}</Text>
          </MenuOption>
        </MenuOptions>
      </Menu>
    </View>
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
    ...Fonts.style.regular,
    marginHorizontal: Metrics.doubleBaseMargin,
    color: Colors.text,
  },

})

export default ScreenHeader