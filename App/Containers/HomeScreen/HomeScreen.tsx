import React, { FunctionComponent, useEffect, useState, useCallback, useRef, useMemo } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './HomeScreenStyle'
import { Colors, Images } from '../../Theme';

import { RNLogger } from '../../Helpers/RNLogger';
import BleHelpers, { BLE_NAME_PREFIX } from '../../Helpers/BleHelpers';
import { BleLogger } from '../../Helpers/BleLogger';
import * as tidyJs from '@tidyjs/tidy';

// BLE
import BleManager, { Peripheral } from 'react-native-ble-manager'
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getDevices } from 'App/Stores/User/Selectors'
import { DeviceModel } from '../../Models/DeviceModel';

// Components
import { Text, View, TouchableOpacity, Button, ScrollView, RefreshControl, Image, Alert } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import NavigationButton from '../../Components/NavigationButton';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import OpenExternalHelpers from '../../Helpers/OpenExternalHelpers';

const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);

type ListItem = DeviceModel & { isConnected: boolean }
type BleListItem = Peripheral & { origin: "bonded" | "scanned", isConnected: boolean }

interface Props {
}

const HomeScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const devices: Array<DeviceModel> = useTypedSelector<Array<DeviceModel>>(getDevices)
  
  // BLE scanning state
  const [isScanning, setIsScanning] = useState(false);
  const scannedPeripherals = useRef(new Map<string, BleListItem>())
  const bondedPeripherals = useRef(new Map<string, BleListItem>())
  const [scanError, setScanError] = useState("");
  // Combine and sort all devices (API devices + scanned BLE devices)
  const sortedItems = useMemo(() => {
    // Get API devices
    const apiDevices = devices.map((device: DeviceModel) => ({ 
      ...device, 
      isConnected: pairedPeripheral?.deviceId === device.id,
      source: 'api' as const
    }));
    
    // Get scanned BLE devices that are not in API devices
    const scanned: Array<BleListItem> = Array.from(scannedPeripherals.current.values());
    const bonded = Array.from(bondedPeripherals.current.values()).filter(p => 
      scanned.findIndex(i => i.id == p.id) == -1
    );
    const allBleDevices = scanned.concat(bonded);
    
    // Convert BLE devices to ListItem format, filtering out those already in API
    const bleDevicesAsListItems = allBleDevices
      .filter(bleDevice => !apiDevices.some(apiDevice => 
        apiDevice.name === bleDevice.name || 
        apiDevice.hardwareId === bleDevice.id
      ))
      .map(bleDevice => ({
        id: '0', // Placeholder ID for BLE-only devices
        name: bleDevice.name || '(NO NAME)',
        hardwareId: bleDevice.id,
        isConnected: bleDevice.id === pairedPeripheral?.id,
        owner: true, // Assume owned for scanned devices
        source: 'ble' as const,
        blePeripheral: bleDevice // Keep reference to the peripheral
      }));
    
    // Combine all devices
    const allDevices = [...apiDevices, ...bleDevicesAsListItems];
    
    // Sort: connected first, then by origin (scanned before bonded), then owned devices
    return tidyJs.tidy(allDevices, tidyJs.arrange([
      tidyJs.desc("isConnected"),                    //connected devices on top
      (a, b) => {
        // Within same connection status, prefer scanned over bonded
        if (a.source === 'ble' && b.source === 'ble') {
          const aPeripheral = (a as any).blePeripheral as BleListItem;
          const bPeripheral = (b as any).blePeripheral as BleListItem;
          if (aPeripheral?.origin === 'scanned' && bPeripheral?.origin === 'bonded') return -1;
          if (aPeripheral?.origin === 'bonded' && bPeripheral?.origin === 'scanned') return 1;
        }
        return 0;
      },
      tidyJs.desc("owner")                           //devices from other groups at the bottom
    ]));
  }, [devices, pairedPeripheral, scannedPeripherals.current.size, bondedPeripherals.current.size]);

  const [listItems, setListItems] = useState<Array<any>>(sortedItems);
  const [isRefreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setRefreshing(false);
    setListItems(sortedItems);
  }, [sortedItems]);

  // BLE Scanning functions
  const handleDiscoverPeripheral = useCallback((peripheral: Peripheral) => {
    BleLogger.log(`[BLE] Found peripheral in HomeScreen - ID: ${peripheral.id}, Name: ${peripheral.name}, RSSI: ${peripheral.rssi}, Connectable: ${peripheral.advertising?.isConnectable}`);
    if (peripheral.advertising?.isConnectable) {
      if (!peripheral.name) {
        peripheral.name = peripheral.advertising?.localName;
        if (!peripheral.name) {
          peripheral.name = '(NO NAME)';
        }
      }
      // Filter list based on name
      if (peripheral.name.startsWith(BLE_NAME_PREFIX)) {
        RNLogger.log(`[RN] HomeScreen: Adding scanned BEEPBASE peripheral: ${peripheral.name} (${peripheral.id})`);
        scannedPeripherals.current.set(peripheral.id, { 
          ...peripheral, 
          origin: "scanned", 
          isConnected: peripheral.id === pairedPeripheral?.id 
        });
        // Force re-render by updating a dummy state
        setListItems(prev => [...prev]);
      } else {
        RNLogger.log(`[RN] HomeScreen: Ignoring non-BEEPBASE peripheral: ${peripheral.name}`);
      }
    } else {
      BleLogger.log(`[BLE] Ignoring non-connectable peripheral: ${peripheral.name} (${peripheral.id})`);
    }
  }, [pairedPeripheral]);

  const handleStopScan = useCallback(() => {
    RNLogger.log('[RN] Scan stopped in HomeScreen');
    setIsScanning(false);
  }, []);

  const scan = useCallback(() => {
    setScanError("");
    if (!isScanning) {
      BleManager.scan([], 10, false).then((results) => {
        RNLogger.log('[RN] Starting scan from HomeScreen...');
        setIsScanning(true);
      }).catch(err => {
        RNLogger.log('[RN] ERROR: Scan failed in HomeScreen: ' + err);
        setScanError(err.toString());
      });
    }
  }, [isScanning]);

  const startScan = useCallback(() => {
    switch (Platform.OS) {
      case "android":
        BleManager.enableBluetooth().then(() => {
          RNLogger.log("[RN] HomeScreen: Bluetooth is already enabled or user confirmed");
          scan();
        })
        .catch((error) => {
          RNLogger.log("[RN] HomeScreen: User refused to enable bluetooth: " + error);
          setScanError("Bluetooth is disabled or not allowed.");
        });
        break;
        
      case "ios":
        scan();
        break;
    }
  }, [scan]);

  // Initialize BLE scanning on mount
  useEffect(() => {
    const BleManagerDiscoverPeripheralSubscription = bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral', 
      handleDiscoverPeripheral
    );
    const BleManagerStopScanSubscription = bleManagerEmitter.addListener(
      'BleManagerStopScan', 
      handleStopScan
    );

    // Initialize scan result with all previously bonded peripherals
    RNLogger.log("[RN] HomeScreen: Getting bonded peripherals...");
    BleManager.getBondedPeripherals().then((peripherals: Array<Peripheral>) => {
      RNLogger.log(`[RN] HomeScreen: Found ${peripherals.length} bonded peripherals`);
      const filtered: Array<Peripheral> = peripherals.filter((peripheral: Peripheral) => 
        peripheral.name?.startsWith(BLE_NAME_PREFIX)
      );
      RNLogger.log(`[RN] HomeScreen: Filtered to ${filtered.length} BEEPBASE peripherals`);
      filtered.forEach(p => {
        RNLogger.log(`[RN] HomeScreen: Adding bonded peripheral: ${p.name} (${p.id})`);
        bondedPeripherals.current.set(p.id, { 
          ...p, 
          origin: "bonded", 
          isConnected: p.id === pairedPeripheral?.id 
        });
      });
      // Force re-render to show bonded devices
      setListItems(prev => [...prev]);
    });
    
    // Start scanning when component mounts
    startScan();
    
    // Cleanup on unmount
    return () => {
      if (isScanning) {
        RNLogger.log("[RN] HomeScreen: Cleaning up: stopping scan");
        BleManager.stopScan();
      }
      
      RNLogger.log("[RN] HomeScreen: Removing BLE event listeners");
      BleManagerDiscoverPeripheralSubscription?.remove();
      BleManagerStopScanSubscription?.remove();
    };
  }, []); // Only run once on mount

  // Update bonded/scanned peripherals connection status when pairedPeripheral changes
  useEffect(() => {
    // Update connection status for all peripherals
    scannedPeripherals.current.forEach((peripheral, id) => {
      peripheral.isConnected = id === pairedPeripheral?.id;
    });
    bondedPeripherals.current.forEach((peripheral, id) => {
      peripheral.isConnected = id === pairedPeripheral?.id;
    });
    // Force re-render
    setListItems(prev => [...prev]);
  }, [pairedPeripheral]);

  const onListItemPress = (device: any) => {
    if (device.source === 'ble' && device.blePeripheral) {
      // For BLE-only devices, navigate to wizard to connect
      RNLogger.log(`[RN] User selected BLE device from HomeScreen: ${device.name} (${device.hardware_id})`);
      navigation.navigate('Wizard');
    } else {
      // For API devices, use existing flow
      RNLogger.log(`[RN] User selected device from HomeScreen: ${device.name} (${device.id})`);
      navigation.navigate('PeripheralDetailScreen', { device, connect: true });
    }
  }

  const onExportLogsPress = async () => {
    try {
      const result = await BleHelpers.exportBleLogFile();
      if (result) {
        Alert.alert(t('common.success'), `Logs exported to: ${result}`,
          [{ text: t('common.ok') }])
      } else {
        Alert.alert(t('common.error'), 'No logs found to export',
          [{ text: t('common.ok') }])
      }
    } catch (error) {
      Alert.alert(t('common.error'), `Failed to export logs: ${error}`,
        [{ text: t('common.ok') }])
    }
  }

  return (
    <>
      <ScreenHeader title={t('home.screenTitle')} menu />
      <View style={styles.container}>
        <View style={styles.spacer} />
        <Text style={styles.text}>{t('home.introduction')}</Text>
        <View style={styles.spacerDouble} />
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Wizard')}>
          <Text style={styles.text}>{t('home.startWizard')}</Text>
        </TouchableOpacity>
        <View style={styles.spacerDouble} />
        <View style={styles.separator} />
        <View style={styles.spacer} />
        <TouchableOpacity style={[styles.button, { backgroundColor: Colors.lighterGrey }]} onPress={onExportLogsPress}>
          <Text style={styles.text}>Export Debug Logs</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
        <ScrollView 
          style={styles.devicesContainer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { 
            setRefreshing(true);
            dispatch(ApiActions.getDevices());
          }} />}
        >
          {listItems.map((item, i) => (
            <NavigationButton
              key={i}
              title={item.name}
              Icon={item.isConnected ? <IconFontAwesome name="bluetooth" size={30} color={Colors.bluetooth} /> : <Image style={{width: 30, height: 30}} source={Images.beepBase} resizeMode='cover'/>}
              IconRight={item.owner ? undefined : <IconFontAwesome name="group" size={30} color={Colors.lighterGrey} />}
              onPress={() => onListItemPress(item)}
            />
          ))}
        </ScrollView>
        <View style={styles.spacer} />
        <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}} onPress={() => OpenExternalHelpers.openUrl('https://beepsupport.freshdesk.com/en/support/solutions/folders/60000479696')}>
          <IconFontAwesome name="question-circle-o" size={22} color={Colors.link} />
          <View style={styles.spacerHalf} />
          <Text style={[styles.text, styles.link]}>{t('home.help')}</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
      </View>
    </>
  )
}

export default HomeScreen;