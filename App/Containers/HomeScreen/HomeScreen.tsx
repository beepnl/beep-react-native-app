import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './HomeScreenStyle'
import { Metrics } from '../../Theme';

// Utils
const nodePackage = require('../../../package.json')   //including node package config for app version

// Data
import SettingsActions from 'App/Stores/Settings/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripherals } from 'App/Stores/Settings/Selectors'
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'

// Components
import { Text, View, TouchableOpacity, Button } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

interface Props {
}

const HomeScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const jsVersion =  nodePackage.version
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)

  const onStartWizardPress = () => {
    navigation.navigate("Wizard")
  }

  const onPeripheralPress = () => {
    if (pairedPeripheral) {
      navigation.navigate("PeripheralDetailScreen")
    }
  }

  return (<>
    <ScreenHeader title={t("home.screenTitle")} />

    <View style={styles.container}>
      <Text style={styles.text}>{t("home.introduction")}</Text>

      <View style={styles.spacerDouble} />
      
      <TouchableOpacity onPress={onStartWizardPress}>
        <Text style={styles.textButton}>{t("home.startWizard")}</Text>
      </TouchableOpacity>

      { pairedPeripheral &&
        <Button title={pairedPeripheral.name} onPress={onPeripheralPress}></Button>
      }

      <View style={styles.spacerDouble} />
      <View style={styles.spacerDouble} />
      <Text style={styles.text}>{t('about.versionJS', { version: jsVersion + (__DEV__ ? " DEV" : "") })}</Text>

    </View>
  </>)
}

export default HomeScreen