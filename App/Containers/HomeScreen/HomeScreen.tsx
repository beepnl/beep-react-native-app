import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { Colors } from '@/App/Theme';
import styles from './HomeScreenStyle';

import BleHelpers from '@/App/Helpers/BleHelpers';
import * as tidyJs from '@tidyjs/tidy';

// BLE
import { Platform } from 'react-native';
import BleManager, { Peripheral } from 'react-native-ble-manager';

// Data
import { DeviceModel } from '@/App/Models/DeviceModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import ApiActions from '@/App/Stores/Api/Actions';
import { getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';
import { getDevices } from '@/App/Stores/User/Selectors';

// Components
import NavigationButton from '@/App/Components/NavigationButton';
import ScreenHeader from '@/App/Components/ScreenHeader';
import { BleLogger } from '@/App/Helpers/BleLogger';
import OpenExternalHelpers from '@/App/Helpers/OpenExternalHelpers';
import { RNLogger } from '@/App/Helpers/RNLogger';
import { Image } from 'expo-image';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';

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
      isConnected: !!pairedPeripheral?.isConnected && pairedPeripheral?.deviceId === device.id,
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
        isConnected: !!pairedPeripheral?.isConnected && bleDevice.id === pairedPeripheral?.id,
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
    if (!BleHelpers.isPeripheralConnectable(peripheral)) {
      BleLogger.log(`[BLE] Ignoring non-connectable peripheral: ${peripheral.name} (${peripheral.id})`);
      return
    }

    if (!peripheral.name) {
      peripheral.name = BleHelpers.getPeripheralName(peripheral) || '(NO NAME)';
    }

    // Filter list based on name
    if (BleHelpers.isBeepBasePeripheral(peripheral)) {
      RNLogger.log(`[RN] HomeScreen: Adding scanned BEEPBASE peripheral: ${peripheral.name} (${peripheral.id})`);
      scannedPeripherals.current.set(peripheral.id, {
        ...peripheral,
        origin: "scanned",
        isConnected: !!pairedPeripheral?.isConnected && peripheral.id === pairedPeripheral?.id
      });
      // Force re-render by updating a dummy state
      setListItems(prev => [...prev]);
    } else {
      RNLogger.log(`[RN] HomeScreen: Ignoring non-BEEPBASE peripheral: ${peripheral.name}`);
    }
  }, [pairedPeripheral]);

  const handleStopScan = useCallback(() => {
    RNLogger.log('[RN] Scan stopped in HomeScreen');
    setIsScanning(false);
  }, []);

  const scan = useCallback(async () => {
    setScanError("");
    if (isScanning) {
      return
    }
    try {
      await BleHelpers.ensureBlePermissions()
      await BleManager.scan({ serviceUUIDs: [], seconds: 10/*, allowDuplicates: false*/ })
      RNLogger.log('[RN] Starting scan from HomeScreen...');
      setIsScanning(true);
    } catch (err: any) {
      RNLogger.log('[RN] ERROR: Scan failed in HomeScreen: ' + err);
      setScanError(err?.message || err?.toString() || 'Scan failed');
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
    const BleManagerDiscoverPeripheralSubscription = BleManager.onDiscoverPeripheral(handleDiscoverPeripheral);
    const BleManagerStopScanSubscription = BleManager.onStopScan(handleStopScan);

    // Initialize scan result with all previously bonded peripherals
    RNLogger.log("[RN] HomeScreen: Getting bonded peripherals...");
    const loadBondedPeripherals = async () => {
      try {
        await BleHelpers.ensureBlePermissions()
        const peripherals = await BleManager.getBondedPeripherals()
        RNLogger.log(`[RN] HomeScreen: Found ${peripherals.length} bonded peripherals`);
        const filtered: Array<Peripheral> = peripherals.filter((peripheral: Peripheral) =>
          BleHelpers.isBeepBasePeripheral(peripheral)
        );
        RNLogger.log(`[RN] HomeScreen: Filtered to ${filtered.length} BEEPBASE peripherals`);
        filtered.forEach(p => {
          RNLogger.log(`[RN] HomeScreen: Adding bonded peripheral: ${p.name} (${p.id})`);
          bondedPeripherals.current.set(p.id, { 
            ...p, 
            origin: "bonded", 
            isConnected: !!pairedPeripheral?.isConnected && p.id === pairedPeripheral?.id
          });
        });
        // Force re-render to show bonded devices
        setListItems(prev => [...prev]);
      } catch (error: any) {
        RNLogger.log(`[RN] HomeScreen: Failed to get bonded peripherals: ${error?.message || error}`)
      }
    }
    loadBondedPeripherals()
    
    // Cleanup on unmount
    return () => {
      RNLogger.log("[RN] HomeScreen: Removing BLE event listeners");
      BleManagerDiscoverPeripheralSubscription?.remove();
      BleManagerStopScanSubscription?.remove();
    };
  }, []); // Only run once on mount

  // Use focus effect to manage scanning based on screen focus
  useFocusEffect(
    useCallback(() => {
      // On focus: start scanning
      RNLogger.log("[RN] HomeScreen: Screen focused, starting scan");
      startScan();
      
      // On blur: stop scanning to avoid conflicts
      return () => {
        if (isScanning) {
          RNLogger.log("[RN] HomeScreen: Screen blurred, stopping scan");
          BleManager.stopScan().catch(() => undefined);
          setIsScanning(false);
        }
      };
    }, [isScanning, startScan])
  );

  // Update bonded/scanned peripherals connection status when pairedPeripheral changes
  useEffect(() => {
    // Update connection status for all peripherals
    scannedPeripherals.current.forEach((peripheral, id) => {
      peripheral.isConnected = !!pairedPeripheral?.isConnected && id === pairedPeripheral?.id;
    });
    bondedPeripherals.current.forEach((peripheral, id) => {
      peripheral.isConnected = !!pairedPeripheral?.isConnected && id === pairedPeripheral?.id;
    });
    // Force re-render
    setListItems(prev => [...prev]);
  }, [pairedPeripheral]);

  const onListItemPress = (device: any) => {
    if (device.source === 'ble' && device.blePeripheral) {
      // For BLE-only devices, navigate to wizard to connect
      RNLogger.log(`[RN] User selected BLE device from HomeScreen: ${device.name} (${device.hardwareId})`);
      navigation.navigate('Wizard');
    } else {
      // For API devices, use existing flow
      RNLogger.log(`[RN] User selected device from HomeScreen: ${device.name} (${device.id})`);
      navigation.navigate('PeripheralDetailScreen', { device, connect: true });
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
        {/* <TouchableOpacity style={[styles.button, { backgroundColor: Colors.lighterGrey }]} onPress={onExportLogsPress}>
          <Text style={styles.text}>Export Debug Logs</Text>
        </TouchableOpacity> */}

        {/* Policy notice above device list */}
        { Platform.OS === 'android' && <>
          <View style={styles.spacer} />
          <View style={styles.noticeContainer} accessibilityRole="text">
            <IconMaterialIcons name="info-outline" size={18} color={Colors.darkYellow} />
            <View style={styles.spacerHalf} />
            <Text style={styles.noticeText}>
              Due to updated Android policies: always pair with a BEEP base using the default passcode (123456) when prompted.
            </Text>
          </View>
        </>}

        <ScrollView 
          style={styles.devicesContainer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { 
            setRefreshing(true);
            dispatch(ApiActions.getDevices());
          }} />}
        >
          {listItems.map((item) => (
            <NavigationButton
              key={item.source === 'api' ? `api-${item.id}` : `ble-${item.hardwareId}`}
              title={item.name}
              Icon={item.isConnected ? <IconFontAwesome name="bluetooth" size={30} color={Colors.bluetooth} /> : <Image style={{width: 30, height: 30}} source={{ uri: "beepbase" }} contentFit='cover'/>}
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
