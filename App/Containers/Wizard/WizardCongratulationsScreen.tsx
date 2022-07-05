import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

// Styles
import styles from './styles'
import { Colors, Fonts, Images, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import { CommonActions } from '@react-navigation/native';
import OpenExternalHelpers from '../../Helpers/OpenExternalHelpers';

// Data

// Components
import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';

interface Props {
  navigation: StackNavigationProp,
}

const WizardCongratulationsScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onInstallPress = () => {
    OpenExternalHelpers.openUrl(`https://beepsupport.freshdesk.com/en/support/solutions/articles/60000711456-how-to-install-your-beep-base-v3-3-3-position-your-beep-base`)
  }
  
  const onRegisterPress = () => {
    OpenExternalHelpers.openUrl(`https://beepsupport.freshdesk.com/en/support/solutions/articles/60000711459-how-to-install-your-beep-base-v3-3-5-connect-to-beep-webapp`)
  }

  const onNextPress = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      }),
    )
  }

  return (<>
    <ScreenHeader title={t("wizard.congratulations.screenTitle")} back />

    <ScrollView style={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.congratulations.description")}</Text>
      </View>

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <TouchableOpacity onPress={onInstallPress}>
          <Text style={[styles.text, styles.link]}>{t("wizard.congratulations.installButton")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <TouchableOpacity onPress={onRegisterPress}>
          <Text style={[styles.text, styles.link]}>{t("wizard.congratulations.registerButton")}</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
    
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.button} onPress={onNextPress}>
        <Text style={styles.text}>{t("common.btnFinish")}</Text>
      </TouchableOpacity>
    </View>
  </>)
}

export default WizardCongratulationsScreen