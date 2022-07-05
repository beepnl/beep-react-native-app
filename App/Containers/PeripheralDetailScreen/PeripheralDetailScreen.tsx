import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './PeripheralDetailScreenStyle'
import { Colors } from '../../Theme';

// Utils
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import { Peripheral } from 'react-native-ble-manager';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Data
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import ApiActions from 'App/Stores/Api/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { DeviceModel } from '../../Models/DeviceModel';
import { CHANNELS } from '../../Models/WeightModel';

// Components
import { Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from 'react-native-gesture-handler';
import NavigationButton from '../../Components/NavigationButton';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type MenuItem = { 
  title: string, 
  screen: string,
  icon: React.ComponentType<any> | React.ReactElement<any> | null, 
}

const MENU_ITEMS: Array<MenuItem> = [
  {
    title: "peripheralDetail.items.temperature",
    screen: "TemperatureScreen",
    icon: <IconFontAwesome name="thermometer-2" size={30} color={Colors.black} />,
  },
  {
    title: "peripheralDetail.items.weight",
    screen: "WeightScreen",
    icon: <IconMaterialCommunityIcons name="scale" size={30} color={Colors.black} />,
  },
  {
    title: "peripheralDetail.items.audio",
    screen: "AudioScreen",
    icon: <IconMaterialCommunityIcons name="microphone-variant" size={30} color={Colors.black} />,
  },
  {
    title: "peripheralDetail.items.lora",
    screen: "LoRaScreen",
    icon: <IconIonicons name="ios-radio-outline" size={30} color={Colors.black} style={{ transform: [{ rotate: '90deg'}] }} />,
  },
  {
    title: "peripheralDetail.items.energy",
    screen: "EnergyScreen",
    icon: <IconMaterialCommunityIcons name="battery-charging-wireless-70" size={30} color={Colors.black} />,
  },
  {
    title: "peripheralDetail.items.logFile",
    screen: "LogFileScreen",
    icon: <IconMaterialCommunityIcons name="download" size={30} color={Colors.black} />,
  },
  {
    title: "peripheralDetail.items.firmware",
    screen: "FirmwareScreen",
    icon: <IconFontAwesome name="microchip" size={30} color={Colors.black} />,
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
  const peripheralEqualsDevice = peripheral?.deviceId === device?.id
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const isConnected = peripheral && peripheral.isConnected

  useEffect(() => {
    if (!peripheralEqualsDevice) {
      if (isConnected) {
        BleHelpers.disconnectPeripheral(peripheral)
      }
      dispatch(BeepBaseActions.setPairedPeripheral(undefined))
    }
  }, [])

  useEffect(() => {
    if (peripheralEqualsDevice && device) {
      //sync current device id into paired peripheral
      dispatch(BeepBaseActions.setPairedPeripheral({ 
        ...peripheral, 
        deviceId: device.id
      }))

      //refresh sensor definitions for sensor detail screens
      dispatch(ApiActions.getSensorDefinitions(device))
    }
  }, [device])

  useEffect(() => {
    if (isConnected) {
      //update current device
      dispatch(BeepBaseActions.setDevice(device))
      
      //get latest sensor readings
      BleHelpers.write(peripheral.id, [COMMANDS.WRITE_DS18B20_CONVERSION, 0xFF])
      const channel = CHANNELS.find(ch => ch.name == "A_GAIN128")?.bitmask
      BleHelpers.write(peripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel, 10])
      BleHelpers.write(peripheral.id, [COMMANDS.READ_AUDIO_ADC_CONFIG])
    }
  }, [isConnected])

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
      //in case we have an invisible connection in the BLE layer try to disconnect
      BleHelpers.disconnectAllPeripherals()
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
      <TouchableOpacity onPress={onToggleConnectionPress}>
        <Text style={styles.label}>{t("peripheralDetail.bleStatus")}<Text style={styles.text}>{t(`peripheralDetail.bleConnectionStatus.${peripheral?.isConnected != undefined ? peripheral.isConnected : false}`)}</Text></Text>
      </TouchableOpacity>

      <View style={styles.spacerDouble} />

      { !isConnected && <>
        <TouchableOpacity style={styles.button} onPress={onToggleConnectionPress} disabled={busy} >
          <Text style={styles.text}>{t(`peripheralDetail.bleConnect.${peripheral ? !peripheral.isConnected : true}`)}</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
      </>}

      { !isConnected && <>
        <Text style={styles.instructions}>{t("peripheralDetail.instructions")}</Text>
        <View style={styles.spacerDouble} />
      </>}

      { !!busy && <Text style={styles.text}>Scanning...</Text> }

      { !!error && <>
        <Text style={[styles.text, styles.error]}>{error}</Text>
        <View style={styles.spacer} />
      </>}

      { isConnected && <>
        <Text style={styles.label}>{t("peripheralDetail.details")}</Text>
        { MENU_ITEMS.map((item: MenuItem) => <NavigationButton key={item.title} title={t(`${item.title}`)} Icon={item.icon} onPress={() => item.screen && navigation.navigate(item.screen)} />) }
      </>}

      <View style={styles.spacer} />

    </ScrollView>
  </>)
}

export default PeripheralDetailScreen