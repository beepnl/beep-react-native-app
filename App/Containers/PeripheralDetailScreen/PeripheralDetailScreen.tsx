import React, { FunctionComponent, useEffect, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { Colors } from '@/App/Theme';
import styles from './PeripheralDetailScreenStyle';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import { BleLogger } from '@/App/Helpers/BleLogger';
import { RNLogger } from '@/App/Helpers/RNLogger';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Peripheral } from 'react-native-ble-manager';

// Data
import { DeviceModel } from '@/App/Models/DeviceModel';
import { FirmwareVersionModel } from '@/App/Models/FirmwareVersionModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { CHANNELS } from '@/App/Models/WeightModel';
import ApiActions from '@/App/Stores/Api/Actions';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import { getFirmwareVersion, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import NavigationButton from '@/App/Components/NavigationButton';
import ScreenHeader from '@/App/Components/ScreenHeader';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type MenuItem = { 
  title: string, 
  screen: string,
  icon: React.ComponentType<any> | React.ReactElement<any> | null,
  supported: boolean,
}

const getMenuItems = (firmwareVersion?: FirmwareVersionModel): Array<MenuItem> => [
  {
    title: "peripheralDetail.items.temperature",
    screen: "TemperatureScreen",
    icon: <FontAwesome name="thermometer-2" size={30} color={Colors.black} />,
    supported: true,
  },
  {
    title: "peripheralDetail.items.weight",
    screen: "WeightScreen",
    icon: <MaterialCommunityIcons name="scale" size={30} color={Colors.black} />,
    supported: true,
  },
  {
    title: "peripheralDetail.items.audio",
    screen: "AudioScreen",
    icon: <MaterialCommunityIcons name="microphone-variant" size={30} color={Colors.black} />,
    supported: true,
  },
  {
    title: "peripheralDetail.items.tilt",
    screen: "TiltScreen",
    icon: <MaterialCommunityIcons name="rotate-right-variant" size={30} color={Colors.black} />,
    supported: firmwareVersion ? firmwareVersion.supportsFeature("tilt") : false,
  },
  {
    title: "peripheralDetail.items.lora",
    screen: "LoRaScreen",
    icon: <Ionicons name="radio-outline" size={30} color={Colors.black} style={{ transform: [{ rotate: '90deg'}] }} />,
    supported: true,
  },
  {
    title: "peripheralDetail.items.energy",
    screen: "EnergyScreen",
    icon: <MaterialCommunityIcons name="battery-charging-wireless-70" size={30} color={Colors.black} />,
    supported: true,
  },
  {
    title: "peripheralDetail.items.clock",
    screen: "ClockScreen",
    icon: <MaterialCommunityIcons name="clock-outline" size={30} color={Colors.black} />,
    supported: firmwareVersion ? firmwareVersion.supportsFeature("clock") : false,
  },
  {
    title: "peripheralDetail.items.logFile",
    screen: "LogFileScreen",
    icon: <MaterialCommunityIcons name="download" size={30} color={Colors.black} />,
    supported: firmwareVersion ? firmwareVersion.supportsFeature("logDownload") : false,
  },
  {
    title: "peripheralDetail.items.firmware",
    screen: "FirmwareScreen",
    icon: <FontAwesome name="microchip" size={30} color={Colors.black} />,
    supported: true,
  },
]

export type PeripheralDetailScreenNavigationParams = {
  device: DeviceModel,
  connect?: boolean,
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
  const connectOnLoad = route.params?.connect
  const peripheralEqualsDevice = peripheral?.deviceId === device?.id
  const firmwareVersion: FirmwareVersionModel = useTypedSelector<FirmwareVersionModel>(getFirmwareVersion)
  const [menuItems, setMenuItems] = useState<Array<MenuItem>>(getMenuItems())
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const isConnected = !!(peripheralEqualsDevice && peripheral?.isConnected)

  useEffect(() => {
    // if (connectOnLoad && !isConnected) {
    if (connectOnLoad) {
      connect()
    }
  }, [connectOnLoad])

  useEffect(() => {
    if (!peripheralEqualsDevice) {
      if (isConnected) {
        BleHelpers.disconnectPeripheral(peripheral.id)
      }
      dispatch(BeepBaseActions.setPairedPeripheral(undefined))
    }
  }, [])

  useEffect(() => {
    if (peripheralEqualsDevice && device && peripheral.deviceId != device.id) {
      //sync current device id into paired peripheral
      dispatch(BeepBaseActions.setPairedPeripheral({ 
        ...peripheral, 
        deviceId: device.id
      }))
    }
  }, [device])

  useEffect(() => {
    if (peripheralEqualsDevice && isConnected) {
      RNLogger.log(`[RN] Device connected in PeripheralDetailScreen, performing initial setup`)
      
      //update current device
      RNLogger.log(`[RN] Setting current device in store: ${device.name}`)
      dispatch(BeepBaseActions.setDevice(device))

      //refresh sensor definitions for sensor detail screens
      RNLogger.log(`[RN] Fetching sensor definitions for device`)
      dispatch(ApiActions.getSensorDefinitions(device))

      //beep the buzzer
      BleLogger.log(`[BLE] Sending buzzer beep command`)
      BleHelpers.write(peripheral.id, COMMANDS.WRITE_BUZZER_DEFAULT_TUNE, 2)

      //get latest sensor readings
      BleLogger.log(`[BLE] Requesting firmware version`)
      BleHelpers.write(peripheral.id, COMMANDS.READ_FIRMWARE_VERSION)
      
      BleLogger.log(`[BLE] Starting temperature sensor conversion`)
      BleHelpers.write(peripheral.id, [COMMANDS.WRITE_DS18B20_CONVERSION, 0xFF])
      
      const channel = CHANNELS.find(ch => ch.name == "A_GAIN128")?.bitmask
      BleLogger.log(`[BLE] Starting weight sensor conversion on channel: ${channel}`)
      BleHelpers.write(peripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel, 10])
      
      BleLogger.log(`[BLE] Reading audio ADC config`)
      BleHelpers.write(peripheral.id, [COMMANDS.READ_AUDIO_ADC_CONFIG])
    }
  }, [peripheral, isConnected])

  useEffect(() => {
    const menuItems = getMenuItems(firmwareVersion)
    setMenuItems(menuItems)
  }, [firmwareVersion])

  const connect = async () => {
    // Fast path: if we're already connected to this device, just update the state
    if (peripheral && peripheral.isConnected && peripheral.deviceId === device.id) {
      RNLogger.log(`[RN] Already connected to device ${device.name}, skipping scan`)
      // Ensure Redux state is in sync
      dispatch(BeepBaseActions.setPairedPeripheral({ 
        ...peripheral,
        deviceId: device.id
      }))
      BleHelpers.retrieveServices(peripheral.id)
      return
    }

    // Check if we have a peripheral ID that matches this device's expected BLE name
    // This could be true if we're connected but the deviceId doesn't match yet
    if (peripheral && peripheral.isConnected && peripheral.name === DeviceModel.getBleName(device)) {
      RNLogger.log(`[RN] Already connected to BLE peripheral ${peripheral.name}, just updating deviceId`)
      dispatch(BeepBaseActions.setPairedPeripheral({ 
        ...peripheral,
        deviceId: device.id
      }))
      BleHelpers.retrieveServices(peripheral.id)
      return
    }

    setBusy(true)
    setError("")
    let scannedPeripheral: Peripheral | undefined
    try {
      if (peripheral?.isConnected) {
        RNLogger.log(`[RN] Disconnecting current peripheral before switching devices: ${peripheral.name} (${peripheral.id})`)
        await BleHelpers.disconnectPeripheral(peripheral.id)
        dispatch(BeepBaseActions.setPairedPeripheral(undefined))
      }

      RNLogger.log(`[RN] Starting scan for device: ${device.name} (BLE name: ${DeviceModel.getBleName(device)})`)
      scannedPeripheral = await BleHelpers.scanPeripheralByName(DeviceModel.getBleName(device))
      await BleHelpers.connectPeripheral(scannedPeripheral.id)
      dispatch(BeepBaseActions.setPairedPeripheral({
        ...scannedPeripheral,
        isConnected: true,
        deviceId: device.id
      }))
    } catch (e) {
      RNLogger.log(`[RN] Connection failed: ${e}`)
      setError(t("peripheralDetail.notFound"))
      if (scannedPeripheral) {
        BleHelpers.disconnectPeripheral(scannedPeripheral.id)?.catch(() => undefined)
      }
    } finally {
      setBusy(false)
    }
  }

  const onToggleConnectionPress = () => {
    RNLogger.log(`[RN] Toggle connection pressed - Current state: ${isConnected ? 'connected' : 'disconnected'}`)
    setError("")
    if (isConnected) {
      RNLogger.log(`[RN] Disconnecting from ${peripheral?.name} (${peripheral?.id})`)
      BleHelpers.disconnectPeripheral(peripheral.id)
      dispatch(BeepBaseActions.setPairedPeripheral({ ...peripheral, isConnected: false }))
    } else {
      RNLogger.log(`[RN] Starting connection process`)
      connect()
    }
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

      { !!busy && <Text style={styles.text}>{t("peripheralDetail.scanning")}</Text> }

      { !!error && <>
        <Text style={[styles.text, styles.error]}>{error}</Text>
        <View style={styles.spacer} />
      </>}

      { isConnected && <>
        <Text style={styles.label}>{t("peripheralDetail.details")}</Text>
        { menuItems.map((item: MenuItem) => item.supported && <NavigationButton key={item.title} title={t(`${item.title}`)} Icon={item.icon} onPress={() => item.screen && navigation.navigate(item.screen, { device })} />) }
      </>}

      <View style={styles.spacer} />

    </ScrollView>
  </>)
}

export default PeripheralDetailScreen
