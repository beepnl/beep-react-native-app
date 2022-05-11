import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useNavigation } from 'react-navigation-hooks';
import { useTranslation } from 'react-i18next';

// Styles
import { Metrics, Colors, Fonts } from '../Theme';

// Utils
import NavigationService from '../Services/NavigationService';

// Redux

// Components
import { StyleSheet, StatusBar, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import Back from 'App/Assets/Images/Back'

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
    <SafeAreaView style={styles.container} >
      <StatusBar backgroundColor={Colors.statusBar} barStyle="light-content"/>

      { !!back &&
        <TouchableOpacity style={styles.back} onPress={onBackPressInternal}>
          <Back />
        </TouchableOpacity>
      }

      <Text style={styles.title}>{title}</Text>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignSelf: "stretch",
    height: Metrics.navBarHeight,
    // justifyContent: 'space-between',
    justifyContent: "center",
    paddingLeft: Metrics.doubleBaseMargin,
    backgroundColor: Colors.yellow,
  },

  back: {
    position: "absolute",
    left: 0,
    bottom: Metrics.baseMargin,
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

})

export default ScreenHeader