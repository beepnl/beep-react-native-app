import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './HomeScreenStyle'
import { Colors } from '../../Theme';

// Utils
const nodePackage = require('../../../package.json')   //including node package config for app version

// Data
import ApiActions from 'App/Stores/Api/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getDevices } from 'App/Stores/User/Selectors'
import { DeviceModel } from '../../Models/DeviceModel';

// Components
import { Text, View, TouchableOpacity, Button, ScrollView, RefreshControl } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NavigationButton from '../../Components/NavigationButton';

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
  const [isRefreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setRefreshing(false)
  }, [devices])

  const onRefresh = () => {
    setRefreshing(true)
    dispatch(ApiActions.getDevices())
  }

  const onStartWizardPress = () => {
    navigation.navigate("Wizard")
  }

  const onPeripheralPress = () => {
    if (pairedPeripheral) {
      navigation.navigate("PeripheralDetailScreen")
    }
  }

  const onDevicePress = (device: DeviceModel) => {
    navigation.navigate("PeripheralDetailScreen", { device })
  }

  return (<>
    <ScreenHeader title={t("home.screenTitle")} menu />

    <View style={styles.container}>
      <View style={styles.spacer} />
      <Text style={styles.text}>{t("home.introduction")}</Text>

      <View style={styles.spacerDouble} />
      
      <TouchableOpacity style={styles.button} onPress={onStartWizardPress}>
        <Text style={styles.text}>{t("home.startWizard")}</Text>
      </TouchableOpacity>

      {/* { pairedPeripheral &&
        <Button title={pairedPeripheral.name} onPress={onPeripheralPress}></Button>
      } */}

      <View style={styles.spacer} />

      <ScrollView style={styles.devicesContainer} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />} >
        { devices.map((device: DeviceModel) => <NavigationButton title={device.name} onPress={() => onDevicePress(device)} />) }
      </ScrollView>

      <View style={styles.spacerDouble} />
      <Text style={styles.text}>{t('about.versionJS', { version: jsVersion + (__DEV__ ? " DEV" : "") })}</Text>
      <View style={styles.spacerDouble} />

    </View>
  </>)
}

export default HomeScreen