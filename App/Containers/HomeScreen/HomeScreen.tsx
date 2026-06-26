import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { Colors } from '@/App/Theme';
import styles from './HomeScreenStyle';

import BleHelpers, { BLE_NAME_PREFIX, BLUETOOTH_ENABLE_REQUIRED_MESSAGE, COMMANDS } from '@/App/Helpers/BleHelpers';
import * as tidyJs from '@tidyjs/tidy';

// BLE
import { Platform } from 'react-native';
import BleManager, { Peripheral } from 'react-native-ble-manager';

// Data
import { DeviceModel } from '@/App/Models/DeviceModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import ApiActions from '@/App/Stores/Api/Actions';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import { getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';
import { getDevices } from '@/App/Stores/User/Selectors';

// Components
import NavigationButton from '@/App/Components/NavigationButton';
import DeviceQuickActions from '@/App/Components/DeviceQuickActions';
import ScreenHeader from '@/App/Components/ScreenHeader';
import { BleLogger } from '@/App/Helpers/BleLogger';
import OpenExternalHelpers from '@/App/Helpers/OpenExternalHelpers';
import { RNLogger } from '@/App/Helpers/RNLogger';
import { Image } from 'expo-image';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import IconFontAwesome from '@expo/vector-icons/FontAwesome';
import IconMaterialIcons from '@expo/vector-icons/MaterialIcons';

type BleListItem = Peripheral & { origin: "bonded" | "scanned", isConnected: boolean }
type HomeListItem = DeviceModel & {
  source: "api" | "ble",
  isConnected: boolean,
  isAdvertising: boolean,
  blePeripheral?: BleListItem,
}

const HOME_SCAN_SECONDS = 10
const HOME_SCAN_RESTART_DELAY_MS = 250

const normalizeBleId = (value?: string) => value?.toUpperCase() || ""

const isDevicePeripheralMatch = (device: DeviceModel, peripheral?: BleListItem) => {
  if (!peripheral) {
    return false
  }

  const names = [
    normalizeBleId(peripheral.name || undefined),
    normalizeBleId(peripheral.advertising?.localName || undefined),
  ]
  const peripheralId = normalizeBleId(peripheral.id)
  const deviceHardwareId = normalizeBleId(device.hardwareId)
  const deviceMac = normalizeBleId(device.mac)

  return names.includes(normalizeBleId(DeviceModel.getBleName(device))) ||
    names.includes(normalizeBleId(DeviceModel.getPreviousBleName(device))) ||
    (!!deviceHardwareId && peripheralId === deviceHardwareId) ||
    (!!deviceMac && peripheralId === deviceMac)
}

const getHomeListItemKey = (item: HomeListItem) => item.source === "api" ? `api-${item.id}` : `ble-${item.hardwareId}`

const isPeripheralConnected = (pairedPeripheral: PairedPeripheralModel | undefined, peripheralId: string) => (
  !!pairedPeripheral?.isConnected &&
  !!pairedPeripheral.id &&
  pairedPeripheral.id === peripheralId
)

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
    const connectedPeripheralId = pairedPeripheral?.isConnected && pairedPeripheral.id ? pairedPeripheral.id : undefined
    const connectedDeviceId = pairedPeripheral?.isConnected && pairedPeripheral.deviceId ? pairedPeripheral.deviceId : undefined
    const scanned: Array<BleListItem> = Array.from(scannedPeripherals.current.values());
    const bonded = Array.from(bondedPeripherals.current.values()).filter(p => 
      scanned.findIndex(i => i.id == p.id) == -1
    );
    const allBleDevices = scanned.concat(bonded);

    const apiDevices: Array<HomeListItem> = devices.map((device: DeviceModel) => {
      const pairedDevicePeripheral = (!!connectedDeviceId && connectedDeviceId === device.id && connectedPeripheralId)
        ? allBleDevices.find(peripheral => peripheral.id === connectedPeripheralId)
        : undefined
      const scannedPeripheral = scanned.find(peripheral => isDevicePeripheralMatch(device, peripheral)) ||
        (pairedDevicePeripheral?.origin === "scanned" ? pairedDevicePeripheral : undefined)
      const bondedPeripheral = bonded.find(peripheral => isDevicePeripheralMatch(device, peripheral)) ||
        (pairedDevicePeripheral?.origin === "bonded" ? pairedDevicePeripheral : undefined)
      const blePeripheral = scannedPeripheral || bondedPeripheral

      return {
        ...device,
        isConnected: (!!connectedDeviceId && connectedDeviceId === device.id) ||
          (!!connectedPeripheralId && !!blePeripheral && connectedPeripheralId === blePeripheral.id),
        isAdvertising: !!scannedPeripheral,
        source: 'api' as const,
        blePeripheral,
      }
    });
    const matchedPeripheralIds = new Set(apiDevices
      .map(device => device.blePeripheral?.id)
      .filter((id): id is string => !!id))
    
    // Convert BLE devices to ListItem format, filtering out those already in API
    const bleDevicesAsListItems: Array<HomeListItem> = allBleDevices
      .filter(bleDevice => !matchedPeripheralIds.has(bleDevice.id) &&
        !apiDevices.some(apiDevice => isDevicePeripheralMatch(apiDevice, bleDevice)))
      .map(bleDevice => ({
        id: '0', // Placeholder ID for BLE-only devices
        name: bleDevice.name || '(NO NAME)',
        hardwareId: bleDevice.id,
        isConnected: !!connectedPeripheralId && bleDevice.id === connectedPeripheralId,
        isAdvertising: bleDevice.origin === "scanned",
        owner: true, // Assume owned for scanned devices
        source: 'ble' as const,
        blePeripheral: bleDevice // Keep reference to the peripheral
      }));
    
    // Combine all devices
    const allDevices = [...apiDevices, ...bleDevicesAsListItems];
    
    // Sort: connected first, then by origin (scanned before bonded), then owned devices
    return tidyJs.tidy(allDevices, tidyJs.arrange([
      tidyJs.desc("isConnected"),                    // connected devices on top
      tidyJs.desc("isAdvertising"),                  // advertising devices before bonded-only devices
      tidyJs.desc("owner"),                          // devices from other groups at the bottom
    ]));
  }, [devices, pairedPeripheral, scannedPeripherals.current.size, bondedPeripherals.current.size]);

  const [listItems, setListItems] = useState<Array<HomeListItem>>(sortedItems);
  const [isRefreshing, setRefreshing] = useState(false);
  const [connectingPeripheralId, setConnectingPeripheralId] = useState<string | null>(null);

  const pairedPeripheralRef = useRef(pairedPeripheral);
  useEffect(() => {
    pairedPeripheralRef.current = pairedPeripheral;
  }, [pairedPeripheral]);

  useEffect(() => {
    setRefreshing(false);
    setListItems(sortedItems);
  }, [sortedItems]);

  // BLE Scanning functions
  const handleDiscoverPeripheral = useCallback((peripheral: Peripheral) => {
   // BleLogger.log(`[BLE] Found peripheral in HomeScreen - ID: ${peripheral.id}, Name: ${peripheral.name}, RSSI: ${peripheral.rssi}, Connectable: ${peripheral.advertising?.isConnectable}`);
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
          isConnected: isPeripheralConnected(pairedPeripheralRef.current, peripheral.id)
        });
        // Force re-render by updating a dummy state
        setListItems(prev => [...prev]);
      } else {
        RNLogger.log(`[RN] HomeScreen: Ignoring non-BEEPBASE peripheral: ${peripheral.name}`);
      }
    } else {
      // BleLogger.log(`[BLE] Ignoring non-connectable peripheral: ${peripheral.name} (${peripheral.id})`);
    }
  }, []);

  const handleStopScan = useCallback(() => {
    if (!isScanningRef.current && !isFocusedRef.current) {
      return;
    }
    RNLogger.log('[RN] HomeScreen: Scan stopped');
    setIsScanning(false);
    isScanningRef.current = false;
  }, []);

  const isScanningRef = useRef(false);
  const isFocusedRef = useRef(false);
  const scanSessionRef = useRef(0);

  const resetScanState = useCallback(() => {
    setIsScanning(false);
    isScanningRef.current = false;
  }, []);

  const stopScan = useCallback(async (reason: string, invalidateSession = true) => {
    if (invalidateSession) {
      scanSessionRef.current += 1;
    }

    try {
      const nativeIsScanning = await BleManager.isScanning();
      if (nativeIsScanning || isScanningRef.current) {
        RNLogger.log(`[RN] HomeScreen: Stopping scan (${reason})`);
        await BleManager.stopScan();
      }
    } catch (error) {
      RNLogger.log(`[RN] HomeScreen: stopScan ignored (${reason}): ${error}`);
    } finally {
      resetScanState();
    }
  }, [resetScanState]);

  const scan = useCallback(async (session: number) => {
    setScanError("");
    if (isScanningRef.current) {
      RNLogger.log('[RN] HomeScreen: Scan already active, skipping new scan');
      return;
    }

    try {
      const hasPermissions = await BleHelpers.ensureScanPermissions();
      if (session !== scanSessionRef.current || !isFocusedRef.current) {
        RNLogger.log('[RN] HomeScreen: Scan start cancelled before permissions resolved');
        return;
      }

      if (!hasPermissions) {
        RNLogger.log('[RN] HomeScreen: Scan permissions not granted');
        setScanError("Nearby devices permission is required to scan for BEEP bases.");
        resetScanState();
        return;
      }

      const nativeIsScanning = await BleManager.isScanning();
      if (nativeIsScanning) {
        RNLogger.log('[RN] HomeScreen: Native scan already active, restarting cleanly');
        await BleManager.stopScan();
        await new Promise(resolve => setTimeout(resolve, HOME_SCAN_RESTART_DELAY_MS));
      }

      if (session !== scanSessionRef.current || !isFocusedRef.current) {
        RNLogger.log('[RN] HomeScreen: Scan start cancelled before native scan');
        return;
      }

      isScanningRef.current = true;
      setIsScanning(true);
      await BleManager.scan({ serviceUUIDs: [], seconds: HOME_SCAN_SECONDS, allowDuplicates: false });
      RNLogger.log(`[RN] HomeScreen: Started ${HOME_SCAN_SECONDS}s scan`);
    } catch (err) {
      RNLogger.log('[RN] ERROR: Scan failed in HomeScreen: ' + err);
      setScanError(String(err));
      resetScanState();
    }
  }, [resetScanState]);

  const startScan = useCallback(async () => {
    const session = scanSessionRef.current + 1;
    scanSessionRef.current = session;
    await stopScan("before starting HomeScreen scan", false);

    if (session !== scanSessionRef.current || !isFocusedRef.current) {
      return;
    }

    try {
      switch (Platform.OS) {
        case "android":
          if (!(await BleHelpers.ensureBluetoothEnabled("HomeScreen"))) {
            RNLogger.log("[RN] HomeScreen: Bluetooth is disabled or Android did not allow enabling it from the app");
            setScanError(BLUETOOTH_ENABLE_REQUIRED_MESSAGE);
            resetScanState();
            return;
          }
          RNLogger.log("[RN] HomeScreen: Bluetooth is enabled");
          break;

        case "ios":
          break;
      }

      if (session !== scanSessionRef.current || !isFocusedRef.current) {
        RNLogger.log('[RN] HomeScreen: Scan start cancelled after Bluetooth enable');
        return;
      }

      await scan(session);
    } catch (error) {
      RNLogger.log("[RN] HomeScreen: Bluetooth readiness check failed: " + error);
      setScanError(BLUETOOTH_ENABLE_REQUIRED_MESSAGE);
      resetScanState();
    }
  }, [resetScanState, scan, stopScan]);

  // Initialize BLE scanning on mount
  useEffect(() => {
    const BleManagerDiscoverPeripheralSubscription = BleManager.onDiscoverPeripheral(handleDiscoverPeripheral);
    const BleManagerStopScanSubscription = BleManager.onStopScan(handleStopScan);

    // Initialize scan result with all previously bonded peripherals
    RNLogger.log("[RN] HomeScreen: Getting bonded peripherals...");
    BleHelpers.ensureConnectPermission().then((hasPermission) => {
      if (!hasPermission) {
        return []
      }
      return BleManager.getBondedPeripherals()
    }).then((peripherals: Array<Peripheral>) => {
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
          isConnected: isPeripheralConnected(pairedPeripheralRef.current, p.id)
        });
      });
      // Force re-render to show bonded devices
      setListItems(prev => [...prev]);
    }).catch(err => {
      RNLogger.log(`[RN] HomeScreen: Error getting bonded peripherals: ${err}`)
    });
    
    // Cleanup on unmount
    return () => {
      RNLogger.log("[RN] HomeScreen: Removing BLE event listeners");
      void stopScan("HomeScreen unmounted");
      BleManagerDiscoverPeripheralSubscription?.remove();
      BleManagerStopScanSubscription?.remove();
    };
  }, [handleDiscoverPeripheral, handleStopScan, stopScan]);

  useFocusEffect(
    useCallback(() => {
      // On focus: start scanning
      isFocusedRef.current = true;
      RNLogger.log("[RN] HomeScreen: Screen focused, starting scan");
      void startScan();
      
      // On blur: stop scanning to avoid conflicts
      return () => {
        isFocusedRef.current = false;
        void stopScan("screen blurred");
      };
    }, [startScan, stopScan])
  );

  // Update bonded/scanned peripherals connection status when pairedPeripheral changes
  useEffect(() => {
    const connectedPeripheralId = pairedPeripheral?.isConnected && pairedPeripheral.id ? pairedPeripheral.id : undefined
    // Update connection status for all peripherals
    scannedPeripherals.current.forEach((peripheral, id) => {
      peripheral.isConnected = !!connectedPeripheralId && id === connectedPeripheralId;
    });
    bondedPeripherals.current.forEach((peripheral, id) => {
      peripheral.isConnected = !!connectedPeripheralId && id === connectedPeripheralId;
    });
    // Force re-render
    setListItems(prev => [...prev]);
  }, [pairedPeripheral]);

  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);

  const connectFromHome = async (item: HomeListItem) => {
    const peripheral = item.blePeripheral
    if (!peripheral) {
      return
    }

    RNLogger.log(`[RN] HomeScreen: Direct connect requested for ${item.name} (${peripheral.id})`)
    setConnectingPeripheralId(peripheral.id)
    setScanError("")

    try {
      await stopScan("connecting from HomeScreen")

      const currentPeripheral = pairedPeripheralRef.current
      if (currentPeripheral?.isConnected && currentPeripheral.id !== peripheral.id) {
        await BleHelpers.disconnectPeripheral(currentPeripheral.id)
        dispatch(BeepBaseActions.clear())
      }

      if (!currentPeripheral?.isConnected || currentPeripheral.id !== peripheral.id) {
        await BleHelpers.connectPeripheral(peripheral.id)
      } else {
        await BleHelpers.retrieveServices(peripheral.id)
      }

      dispatch(BeepBaseActions.setPairedPeripheral({
        ...peripheral,
        isConnected: true,
        deviceId: item.source === "api" ? item.id : "",
      }))

      if (item.source === "api") {
        dispatch(BeepBaseActions.setDevice(item))
        dispatch(ApiActions.getSensorDefinitions(item))
      } else {
        BleHelpers.write(peripheral.id, COMMANDS.READ_FIRMWARE_VERSION)
        BleHelpers.write(peripheral.id, COMMANDS.READ_HARDWARE_VERSION)
        BleHelpers.write(peripheral.id, COMMANDS.READ_ATECC_READ_ID)
      }
    } catch (error) {
      RNLogger.log(`[RN] HomeScreen: Direct connect failed for ${peripheral.id}: ${error}`)
      setScanError(String(error))
    } finally {
      setConnectingPeripheralId(null)
    }
  }

  const onListItemPress = (device: HomeListItem) => {
    const itemKey = getHomeListItemKey(device)

    if (expandedDeviceId === itemKey) {
      setExpandedDeviceId(null);
      return
    }

    setExpandedDeviceId(itemKey);

    if (device.blePeripheral?.origin === "scanned") {
      void connectFromHome(device)
      return
    }

    if (device.source === 'ble') {
      RNLogger.log(`[RN] HomeScreen: BLE-only device is bonded but not advertising: ${device.name} (${device.hardwareId})`);
    } else {
      RNLogger.log(`[RN] User toggled device from HomeScreen: ${device.name} (${device.id})`);
    }
  }

  const getListSubTitle = (item: HomeListItem) => {
    if (connectingPeripheralId === item.blePeripheral?.id) {
      return "Connecting..."
    }

    if (item.isConnected) {
      return "Connected"
    }

    if (item.isAdvertising) {
      return item.blePeripheral?.rssi ? `Available now (${item.blePeripheral.rssi} dBm)` : "Available now"
    }

    if (item.source === "ble") {
      return "Bonded, not advertising"
    }

    return undefined
  }

  const getListIcon = (item: HomeListItem) => {
    if (item.isConnected) {
      return <IconFontAwesome name="bluetooth" size={30} color={Colors.bluetooth} />
    }

    if (item.isAdvertising) {
      return <IconMaterialIcons name="bluetooth-searching" size={30} color={Colors.green} />
    }

    return <Image style={{width: 30, height: 30}} source={{ uri: "beepbase" }} contentFit='cover'/>
  }

  const getListIconRight = (item: HomeListItem) => {
    if (item.isAdvertising) {
      return (
        <View style={styles.availableBadge}>
          <Text style={styles.availableBadgeText}>Available</Text>
        </View>
      )
    }

    if (!item.owner) {
      return <IconFontAwesome name="group" size={30} color={Colors.lighterGrey} />
    }

    return undefined
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
            <IconMaterialIcons name="info-outline" size={22} color={Colors.darkYellow} />
            <View style={styles.spacerHalf} />
            <Text style={styles.noticeText}>
              DEFAULT PASSCODE IS 123456
            </Text>
          </View>
        </>}

        {!!scanError && <>
          <Text style={[styles.text, styles.error]}>{scanError}</Text>
          <View style={styles.spacer} />
        </>}

        <ScrollView 
          style={styles.devicesContainer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { 
            setRefreshing(true);
            dispatch(ApiActions.getDevices());
          }} />}
        >
          {listItems.map((item) => (
            <React.Fragment key={getHomeListItemKey(item)}>
              <NavigationButton
                title={item.name}
                subTitle={getListSubTitle(item)}
                selected={item.isAdvertising || item.isConnected}
                Icon={getListIcon(item)}
                IconRight={getListIconRight(item)}
                onPress={() => onListItemPress(item)}
              />
              {item.source === 'api' && expandedDeviceId === getHomeListItemKey(item) && connectingPeripheralId === item.blePeripheral?.id && (
                <View style={styles.bleOnlyPanel}>
                  <Text style={styles.bleOnlyText}>Connecting to this BEEP base...</Text>
                </View>
              )}
              {item.source === 'api' && expandedDeviceId === getHomeListItemKey(item) && connectingPeripheralId !== item.blePeripheral?.id && (
                <DeviceQuickActions device={item} />
              )}
              {item.source === 'ble' && expandedDeviceId === getHomeListItemKey(item) && (
                <View style={styles.bleOnlyPanel}>
                  <Text style={styles.bleOnlyText}>
                    {item.isConnected ? "Connected to this BEEP base." : "This BEEP base is bonded but not linked to a device in your BEEP account."}
                  </Text>
                  <TouchableOpacity
                    style={styles.bleOnlyButton}
                    onPress={() => navigation.navigate("Wizard", item.isConnected ? { screen: "WizardRegisterScreen" } : undefined)}
                  >
                    <Text style={styles.bleOnlyButtonText}>{item.isConnected ? "Continue setup" : "Open setup wizard"}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </React.Fragment>
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
