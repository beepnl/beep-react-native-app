import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import {useFocusEffect, NavigationProp, StackActions} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { Colors, Fonts, Metrics } from '@/App/Theme';
import styles from './styles';

// Utils
import BleHelpers, { BLE_NAME_PREFIX, BLUETOOTH_ENABLE_REQUIRED_MESSAGE, COMMANDS } from '@/App/Helpers/BleHelpers';
import { BleLogger } from '@/App/Helpers/BleLogger';
import { RNLogger } from '@/App/Helpers/RNLogger';
import * as tidyJs from '@tidyjs/tidy';
import { Platform } from 'react-native';
import BleManager, { Peripheral } from 'react-native-ble-manager';

// Data
import { FirmwareVersionModel } from '@/App/Models/FirmwareVersionModel';
import { HardwareVersionModel } from '@/App/Models/HardwareVersionModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import { getFirmwareVersion, getHardwareVersion, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import NavigationButton from '@/App/Components/NavigationButton';
import ScreenHeader from '@/App/Components/ScreenHeader';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import * as Progress from 'react-native-progress';
import Icon from '@expo/vector-icons/MaterialIcons';

type ListItem = Peripheral & { origin: "bonded" | "scanned", isConnected: boolean }

const WIZARD_SCAN_SECONDS = 10
const WIZARD_SCAN_RESTART_DELAY_MS = 250

interface Props {
  navigation: NavigationProp<any>,
}

const WizardPairPeripheralScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel | undefined = useTypedSelector<PairedPeripheralModel | undefined>(getPairedPeripheral)
  const [isScanning, setIsScanning] = useState(false);
  const scannedPeripherals = useRef(new Map<string, ListItem>())
  const bondedPeripherals = useRef(new Map<string, ListItem>())
  const [list, setList] = useState<Array<ListItem>>([])
  const [connectingPeripheral, setConnectingPeripheral] = useState<Peripheral | null>(null)
  const [error, setError] = useState("")
  const firmwareVersion: FirmwareVersionModel | undefined = useTypedSelector<FirmwareVersionModel | undefined>(getFirmwareVersion)
  const hardwareVersion: HardwareVersionModel | undefined = useTypedSelector<HardwareVersionModel | undefined>(getHardwareVersion)

  const pairedPeripheralRef = useRef(pairedPeripheral);
  const isScanningRef = useRef(false);
  const isFocusedRef = useRef(false);
  const scanSessionRef = useRef(0);

  useEffect(() => {
    pairedPeripheralRef.current = pairedPeripheral;
  }, [pairedPeripheral]);

  const refreshList = useCallback(() => {
    const scanned: Array<ListItem> = Array.from(scannedPeripherals.current.values())
    const bonded = Array.from(bondedPeripherals.current.values()).filter(p => scanned.findIndex(i => i.id == p.id) == -1)
    const merged = scanned.concat(bonded)
    RNLogger.log(`[RN] Refreshing list - Scanned: ${scanned.length}, Bonded (unique): ${bonded.length}, Total: ${merged.length}`)

    const sorted = tidyJs.tidy(merged, tidyJs.arrange([
      tidyJs.desc("isConnected"),                    //connected devices on top
    ]))
    RNLogger.log(`[RN] List sorted by connection status`)
    setList(sorted)
  }, [])

  const resetScanState = useCallback(() => {
    setIsScanning(false)
    isScanningRef.current = false
  }, [])

  const handleStopScan = useCallback(() => {
    if (!isScanningRef.current && !isFocusedRef.current) {
      return
    }
    RNLogger.log('[RN] WizardPairPeripheralScreen: Scan stopped')
    resetScanState()
  }, [resetScanState])

  const handleDiscoverPeripheral = useCallback((peripheral: Peripheral) => {
    // BleLogger.log(`[BLE] Found peripheral in wizard - ID: ${peripheral.id}, Name: ${peripheral.name}, RSSI: ${peripheral.rssi}, Connectable: ${peripheral.advertising?.isConnectable}`);
    if (peripheral.advertising?.isConnectable) {
      if (!peripheral.name) {
        peripheral.name = peripheral.advertising?.localName;
        if (!peripheral.name) {
          peripheral.name = '(NO NAME)';
        }
      }
      //filter list based on name
      if (peripheral.name.startsWith(BLE_NAME_PREFIX)) {
        RNLogger.log(`[RN] Adding scanned BEEPBASE peripheral: ${peripheral.name} (${peripheral.id})`)
        scannedPeripherals.current?.set(peripheral.id, { ...peripheral, origin: "scanned", isConnected: peripheral.id == pairedPeripheralRef.current?.id });
        refreshList()
      } else {
        RNLogger.log(`[RN] Ignoring non-BEEPBASE peripheral: ${peripheral.name}`)
      }
    } else {
      // BleLogger.log(`[BLE] Ignoring non-connectable peripheral: ${peripheral.name} (${peripheral.id})`);
    }
  }, [refreshList])

  const stopScan = useCallback(async (reason: string, invalidateSession = true) => {
    if (invalidateSession) {
      scanSessionRef.current += 1
    }

    try {
      const nativeIsScanning = await BleManager.isScanning()
      if (nativeIsScanning || isScanningRef.current) {
        RNLogger.log(`[RN] WizardPairPeripheralScreen: Stopping scan (${reason})`)
        await BleManager.stopScan()
      }
    } catch (error) {
      RNLogger.log(`[RN] WizardPairPeripheralScreen: stopScan ignored (${reason}): ${error}`)
    } finally {
      resetScanState()
    }
  }, [resetScanState])

  const scan = useCallback(async (session: number) => {
    setError("")
    refreshList()

    if (isScanningRef.current) {
      RNLogger.log("[RN] WizardPairPeripheralScreen: Scan already active, skipping new scan")
      return
    }

    try {
      const nativeIsScanning = await BleManager.isScanning()
      if (nativeIsScanning) {
        RNLogger.log("[RN] WizardPairPeripheralScreen: Native scan already active, restarting cleanly")
        await BleManager.stopScan()
        await new Promise(resolve => setTimeout(resolve, WIZARD_SCAN_RESTART_DELAY_MS))
      }

      if (session !== scanSessionRef.current || !isFocusedRef.current) {
        RNLogger.log("[RN] WizardPairPeripheralScreen: Scan start cancelled before native scan")
        return
      }

      setConnectingPeripheral(null)
      isScanningRef.current = true
      setIsScanning(true)
      await BleManager.scan({ serviceUUIDs: [], seconds: WIZARD_SCAN_SECONDS, allowDuplicates: false })
      RNLogger.log(`[RN] WizardPairPeripheralScreen: Started ${WIZARD_SCAN_SECONDS}s scan`)
    } catch (err) {
      RNLogger.log('[RN] ERROR: Scan failed: ' + err)
      setError(String(err))
      resetScanState()
    }
  }, [refreshList, resetScanState])

  const startScan = useCallback(async () => {
    const session = scanSessionRef.current + 1
    scanSessionRef.current = session
    await stopScan("before starting wizard scan", false)

    if (session !== scanSessionRef.current || !isFocusedRef.current) {
      return
    }

    try {
      switch (Platform.OS) {
        case "android": {
          const hasPermissions = await BleHelpers.ensureScanPermissions()
          if (session !== scanSessionRef.current || !isFocusedRef.current) {
            RNLogger.log("[RN] WizardPairPeripheralScreen: Scan start cancelled before permissions resolved")
            return
          }

          if (!hasPermissions) {
            setError("Nearby devices permission is required. Enable it in Android Settings > Permissions.")
            resetScanState()
            return
          }

          if (!(await BleHelpers.ensureBluetoothEnabled("WizardPairPeripheralScreen"))) {
            RNLogger.log("[RN] WizardPairPeripheralScreen: Bluetooth is disabled or Android did not allow enabling it from the app")
            setError(BLUETOOTH_ENABLE_REQUIRED_MESSAGE)
            resetScanState()
            return
          }
          RNLogger.log("[RN] WizardPairPeripheralScreen: Bluetooth is enabled");
          break
        }

        case "ios":
          break
      }

      if (session !== scanSessionRef.current || !isFocusedRef.current) {
        RNLogger.log("[RN] WizardPairPeripheralScreen: Scan start cancelled after Bluetooth enable")
        return
      }

      await scan(session)
    } catch (error) {
      RNLogger.log("[RN] WizardPairPeripheralScreen: Bluetooth readiness check failed: " + error)
      setError(BLUETOOTH_ENABLE_REQUIRED_MESSAGE)
      resetScanState()
    }
  }, [resetScanState, scan, stopScan])

  useEffect(() => {
    if (pairedPeripheralRef.current?.isConnected) {
      RNLogger.log("[RN] WizardPairPeripheralScreen: Already connected from HomeScreen, skipping pair list setup")
      return () => {}
    }

    const BleManagerDiscoverPeripheralSubscription = BleManager.onDiscoverPeripheral(handleDiscoverPeripheral);
    const BleManagerStopScanSubscription = BleManager.onStopScan(handleStopScan);

    dispatch(BeepBaseActions.setFirmwareVersion(undefined))
    dispatch(BeepBaseActions.setHardwareVersion(undefined))

    //initialize scan result with all previously bonded peripherals
    RNLogger.log("[RN] WizardPairPeripheralScreen: Getting bonded peripherals...")
    if (Platform.OS === 'android') {
      BleHelpers.ensureConnectPermission().then((hasPermission) => {
        if (!hasPermission) {
          return []
        }
        return BleManager.getBondedPeripherals()
      }).then((peripherals: Array<Peripheral>) => {
        RNLogger.log(`[RN] Found ${peripherals.length} bonded peripherals`)
        const filtered: Array<Peripheral> = peripherals.filter((peripheral: Peripheral) => peripheral.name?.startsWith(BLE_NAME_PREFIX))
        RNLogger.log(`[RN] Filtered to ${filtered.length} BEEPBASE peripherals`)
        filtered.forEach(p => {
          RNLogger.log(`[RN] Adding bonded peripheral: ${p.name} (${p.id})`)
          bondedPeripherals.current?.set(p.id, { ...p, origin: "bonded", isConnected: p.id == pairedPeripheralRef.current?.id })
        });
        refreshList()
      }).catch(err => {
        RNLogger.log(`[RN] Error getting bonded peripherals: ${err}`)
      })
    }

    return (() => {
      RNLogger.log("[RN] WizardPairPeripheralScreen: Removing BLE event listeners")
      void stopScan("WizardPairPeripheralScreen unmounted")
      BleManagerDiscoverPeripheralSubscription?.remove()
      BleManagerStopScanSubscription?.remove()
    })
  }, [dispatch, handleDiscoverPeripheral, handleStopScan, refreshList, stopScan])

  // Use focus effect to manage scanning based on screen focus
  useFocusEffect(
    useCallback(() => {
      if (pairedPeripheralRef.current?.isConnected) {
        RNLogger.log("[RN] WizardPairPeripheralScreen: Already connected, going directly to registration")
        resetScanState()
        navigation.dispatch(StackActions.replace("WizardRegisterScreen"))
        return () => {}
      }

      // On focus: start scanning
      isFocusedRef.current = true
      RNLogger.log("[RN] WizardPairPeripheralScreen: Screen focused, starting scan")
      void startScan()

      // On blur: stop scanning to avoid conflicts
      return () => {
        isFocusedRef.current = false
        void stopScan("screen blurred")
      };
    }, [navigation, resetScanState, startScan, stopScan])
  )

  useEffect(() => {
    refreshList()
  }, [pairedPeripheral, refreshList])

  const onPeripheralPress = (peripheral: Peripheral) => {
    RNLogger.log(`[RN] User selected peripheral: ${peripheral.name} (${peripheral.id})`)
    setConnectingPeripheral(peripheral)
    RNLogger.log(`[RN] Clearing firmware and hardware version from store`)
    dispatch(BeepBaseActions.setFirmwareVersion(undefined))
    dispatch(BeepBaseActions.setHardwareVersion(undefined))
    connectPeripheral(peripheral)
  }

  const connectPeripheral = (peripheral: Peripheral) => {
    RNLogger.log(`[RN] Connecting to peripheral in wizard - ID: ${peripheral.id}, Name: ${peripheral.name}`)

    stopScan("connecting to peripheral").then(() => {
      RNLogger.log("[RN] Scan stopped, preparing to connect...")
      setError("")
      BleHelpers.connectPeripheral(peripheral.id)
      .then(() => {
        RNLogger.log("[RN] Connected to " + peripheral.name + " in wizard")

        //if connected to another peripheral clear beep base store
        if (pairedPeripheral?.id != peripheral.id) {
          RNLogger.log("[RN] Connected to different peripheral, clearing BeepBase store")
          RNLogger.log(`[RN] Previous peripheral: ${pairedPeripheral?.id}, New peripheral: ${peripheral.id}`)
          dispatch(BeepBaseActions.clear())
        } else {
          RNLogger.log("[RN] Connected to same peripheral, keeping BeepBase store")
        }

        //set paired peripheral in beep base store
        RNLogger.log("[RN] Setting paired peripheral in store")
        const newPairedPeripheral = new PairedPeripheralModel({
          id: peripheral.id,
          name: peripheral.name,
        })
        dispatch(BeepBaseActions.setPairedPeripheral(newPairedPeripheral))

        //beep the buzzer
        // BleLogger.log("[BLE] Writing buzzer command")
        BleHelpers.write(peripheral.id, COMMANDS.WRITE_BUZZER_DEFAULT_TUNE, 2)

        //retrieve versions
        // // BleLogger.log("[BLE] Requesting firmware version")
        BleHelpers.write(peripheral.id, COMMANDS.READ_FIRMWARE_VERSION)
        // BleLogger.log("[BLE] Requesting hardware version")
        BleHelpers.write(peripheral.id, COMMANDS.READ_HARDWARE_VERSION)
      })
      .catch((error) => {
        const errorMessage = `[RN] Connection error in wizard for ${peripheral.id}: ${error}`;
        RNLogger.log(errorMessage);
        setError(errorMessage);
        setConnectingPeripheral(null);
      });
    })
  }

  const onNextPress = () => {
    navigation.navigate("WizardRegisterScreen")
  }

  const showNext = !!pairedPeripheral && pairedPeripheral.isConnected && firmwareVersion
  let showProgress = isScanning || (connectingPeripheral != null)
  if (showNext) {
    showProgress = false
  }

  let message = ""
  if (error) {
    message = error
  } else if (isScanning) {
    message = t("wizard.pair.scanning")
  } else {
    if (showNext) {
      message = t("wizard.pair.connected")
    } else if (connectingPeripheral != null) {
      message = t("wizard.pair.connecting")
    } else {
      if (scannedPeripherals.current?.size == 0) {
        message = t("wizard.pair.scanResult_zero")
      } else {
        message = t("wizard.pair.scanResult", { count: scannedPeripherals.current?.size })
      }
    }
  }

  const getSubTitle = (peripheralItem: ListItem): string => {
    if (peripheralItem.id === connectingPeripheral?.id || peripheralItem.id === pairedPeripheral?.id) {
      if (firmwareVersion && hardwareVersion) {
        //connected
        return t("wizard.pair.subtitleConnected", { firmware: firmwareVersion.toString(), hardware: hardwareVersion.toString() })
      } else {
        if (peripheralItem.id === connectingPeripheral?.id) {
          //connecting
          return t("wizard.pair.subtitleConnecting")
        }
        //semi connected. There is an active BLE connection but we still need to retrieve firmware and hardware versions
        return t("wizard.pair.subtitleTapToConnect")
      }
    }
    return t("wizard.pair.subtitleNotConnected") 
  }

  const getIcon = (peripheralItem: ListItem): React.ComponentType<any> | React.ReactElement<any> | null => {
    const isScanResult = peripheralItem.origin != "bonded"
    const isConnected = (peripheralItem == connectingPeripheral && firmwareVersion && hardwareVersion) ||
                        (pairedPeripheral?.id == peripheralItem?.id)

    let iconName
    let color
    if (isConnected) {
      iconName = "bluetooth"
      color = Colors.bluetooth
    } else {
      if (isScanResult) {
        iconName = "bluetooth"
        color = Colors.black
      } else {
        iconName = "bluetooth"
        // iconName = "settings"
        color = Colors.lightGrey
      }
    }

    return <Icon name={iconName} size={30} color={color} />
  }

  return (<>
    <ScreenHeader title={t("wizard.pair.screenTitle")} back />

    <View style={styles.container}>

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.pair.description")}</Text>
      </View>

      <View style={styles.itemContainer}>
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{t("wizard.pair.defaultPin")}</Text>
      </View>

      <View style={styles.spacer} />

      <View style={[styles.messageContainer, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
        <Text style={[styles.text, { textAlign: "center" }, error && styles.error ]}>{message}</Text>
        { showProgress &&
          <Progress.CircleSnail style={{marginLeft: Metrics.doubleBaseMargin, alignSelf: "center"}} color={Colors.yellow} />
        }
      </View>
      
      <View style={styles.spacer} />
      <View style={styles.separator} />
      <View style={styles.spacer} />

      <FlatList
        data={list}
        renderItem={({ item }) => 
          <NavigationButton 
            title={item.name} 
            subTitle={getSubTitle(item)}
            onPress={() => onPeripheralPress(item)}
            showArrow={false} 
            Icon={getIcon(item)}
            selected={item == connectingPeripheral} 
          />
        }
        keyExtractor={item => `${item.id}${item.origin}`}
      />

      { (!isScanning && connectingPeripheral == null) && <>
        <View style={styles.spacerDouble} />
        <TouchableOpacity style={styles.button} onPress={startScan} >
          <Text style={styles.text}>{t("wizard.pair.retry")}</Text>
        </TouchableOpacity>
      </>}

      <View style={styles.spacer} />

      { showNext &&
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      }
    </View>
  </>)
}

export default WizardPairPeripheralScreen
