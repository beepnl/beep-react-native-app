import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './PeripheralDetailScreenStyle'
import { Colors } from '../../Theme';

// Utils
import BleHelpers from '../../Helpers/BleHelpers';
import { Peripheral } from 'react-native-ble-manager';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Data
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import ApiActions from 'App/Stores/Api/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral, getSensorDefinitions } from 'App/Stores/BeepBase/Selectors'
import { DeviceModel } from '../../Models/DeviceModel';
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel';

// Components
import { Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from 'react-native-gesture-handler';
import NavigationButton from '../../Components/NavigationButton';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type MenuItem = { 
  title: string, 
  screen: string,
  icon: React.ComponentType<any> | React.ReactElement<any> | null, 
}

const MENU_ITEMS: Array<MenuItem> = [
  {
    title: "Temperature",
    icon: <IconFontAwesome name="thermometer-2" size={30} color={Colors.black} />,
    screen: "TemperatureScreen",
  },
  {
    title: "Download data",
    icon: null,
    screen: "LogFileScreen",
  },
  {
    title: "Firmware",
    icon: null,
    screen: "FirmwareScreen",
  },
]

export type PeripheralDetailScreenNavigationParams = {
  device: DeviceModel,
}

type Props = NativeStackScreenProps<PeripheralDetailScreenNavigationParams>

const PeripheralDetailScreen: FunctionComponent<Props> = ({
  route,
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const device: DeviceModel = route.params?.device
  const peripheralEqualsDevice = peripheral?.name === device?.name
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const isConnected = peripheral && peripheral.isConnected

  useEffect(() => {
    if (device) {
      //sync current device id into paired peripheral
      dispatch(BeepBaseActions.setPairedPeripheral({ 
        ...peripheral, 
        deviceId: device.id
      }))

      //refresh sensor definitions for sensor detail screens
      dispatch(ApiActions.getSensorDefinitions(device))
    }
  }, [device])

  const connect = () => {
    setBusy(true)
    BleHelpers.scanPeripheralByName(DeviceModel.getBleName(device)).then((peripheral: Peripheral) => {
      BleHelpers.connectPeripheral(peripheral.id).then(() => {
        dispatch(BeepBaseActions.setPairedPeripheral({ 
          ...peripheral, 
          isConnected: true,
          deviceId: device.id
        }))
        setBusy(false)
      })
    }).catch(() => {
      //peripheral not found
      setError("Peripheral not found")
      setBusy(false)
    })
  }

  const onToggleConnectionPress = () => {
    setError("")
    if (isConnected) {
      BleHelpers.disconnectPeripheral(peripheral)
      dispatch(BeepBaseActions.setPairedPeripheral({ ...peripheral, isConnected: false }))
    } else {
      connect()
    }

    //OK:
    // if (peripheral) {
    //   console.log("peripheral.isConnected", peripheral.isConnected)
    //   if (peripheral.isConnected) {
    //     BleHelpers.disconnectPeripheral(peripheral)?.then(() => {
    //       const updated = {
    //         ...peripheral,
    //         isConnected: false,
    //       }
    //       dispatch(BeepBaseActions.setPairedPeripheral(updated))  
    //     })
    //   } else {
    //     BleHelpers.connectPeripheral(peripheral.id)?.then(() => {
    //       const updated = {
    //         ...peripheral,
    //         isConnected: true,
    //       }
    //       dispatch(BeepBaseActions.setPairedPeripheral(updated))  
    //     })
    //   }
    // }
  }

  return (<>
    <ScreenHeader title={t("peripheralDetail.screenTitle")} back />

    <ScrollView style={styles.container} >
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("peripheralDetail.deviceName")}<Text style={styles.text}>{device?.name}</Text></Text>
      <Text style={styles.label}>{t("peripheralDetail.bleName")}<Text style={styles.text}>{DeviceModel.getBleName(device)}</Text></Text>
      <Text style={styles.label}>{t("peripheralDetail.bleStatus")}<Text style={styles.text}>{t(`peripheralDetail.bleConnectionStatus.${peripheral ? peripheral.isConnected : false}`)}</Text></Text>

      <View style={styles.spacerDouble} />

      { !isConnected && <>
        <TouchableOpacity style={styles.button} onPress={onToggleConnectionPress} disabled={busy} >
          <Text style={styles.text}>{t(`peripheralDetail.bleConnect.${peripheral ? !peripheral.isConnected : true}`)}</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
      </>}

      { !!busy && <Text>Scanning...</Text> }

      { !!error && <>
        <Text style={styles.error}>{error}</Text>
        <View style={styles.spacer} />
      </>}

      { !isConnected && <>
        <Text style={styles.instructions}>{t("peripheralDetail.instructions")}</Text>
        <View style={styles.spacer} />
      </>}

      {/* <View style={styles.spacer} /> */}

      { isConnected && <>
        <Text style={styles.label}>{t("peripheralDetail.details")}</Text>
        { MENU_ITEMS.map((item: MenuItem) => <NavigationButton key={item.title} title={item.title} Icon={item.icon} onPress={() => item.screen && navigation.navigate(item.screen)} />) }
      </>}

      <View style={styles.spacer} />

    </ScrollView>
  </>)
}

export default PeripheralDetailScreen