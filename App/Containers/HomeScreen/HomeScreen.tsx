import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './HomeScreenStyle'

// Utils
const nodePackage = require('../../../package.json')   //including node package config for app version

// Data
import SettingsActions from 'App/Stores/Settings/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getDevices } from 'App/Stores/User/Selectors'
import { DeviceModel } from '../../Models/DeviceModel';

// Components
import { Text, View, TouchableOpacity, Button } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';

interface Props {
}

const HomeScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const jsVersion =  nodePackage.version
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const devices: Array<DeviceModel> = useTypedSelector<Array<DeviceModel>>(getDevices)

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

      { devices.map((device: DeviceModel) => {
        return <Text style={styles.text}>{device.id + " " + device.hardwareId + " " + device.name}</Text>
      })

      }

      <View style={styles.spacerDouble} />
      <View style={styles.spacerDouble} />
      <Text style={styles.text}>{t('about.versionJS', { version: jsVersion + (__DEV__ ? " DEV" : "") })}</Text>

    </View>
  </>)
}

export default HomeScreen