import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './AboutScreenStyle'
import { ApplicationStyles, Colors, Fonts, Metrics } from '../../Theme';

// Utils
const nodePackage = require('../../../package.json')   //including node package config for app version

// Redux

// Components
import { ScrollView, Text, View } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import OpenExternalHelpers from '../../Helpers/OpenExternalHelpers';

interface Props {
}

const AboutScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const logoWidth = Metrics.clientWidth / 1.5
  const logoHeight = logoWidth * (38/170)
  const jsVersion =  nodePackage.version
  
  useEffect(() => {
  }, [])

  const onPhonePress = () => {
  }
  
  const onEmailPress = () => {
  }
  
  return (
    <View style={styles.mainContainer}>
      <ScreenHeader title={t("about.screenTitle")} back />

      <ScrollView>
        <View style={styles.spacer} />
        
        <View style={styles.itemContainer}>
        </View>

        <View style={styles.spacer} />

        <Text style={styles.itemText}>{t('wizard.welcome.description')}</Text>

        {/* <Text style={styles.itemText}>{t('about.contact', { phone: t("about.phone"), email: t("about.email") })} */}
        <Text style={styles.itemText}>{t('about.contact1')}
          <Text style={[styles.itemText, { color: Colors.green }]} onPress={onPhonePress}>{t("about.phone")}</Text>
          <Text style={styles.itemText}>{t('about.contact2')}</Text>
          <Text style={[styles.itemText, { color: Colors.green }]} onPress={onEmailPress}>{t("about.email")}</Text>
        </Text>

        <View style={styles.spacerDouble} />
        
        <Text style={styles.itemText}>{t('about.versionJS', { version: jsVersion + (__DEV__ ? " DEV" : "") })}</Text>
        
      </ScrollView>
    </View>
  )
}

export default AboutScreen