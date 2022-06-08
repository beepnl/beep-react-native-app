import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { Colors, Fonts, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import BleManager, { Peripheral } from 'react-native-ble-manager'
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import { Platform } from 'react-native'

// Data
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getFirmwareVersion, getHardwareVersion } from 'App/Stores/BeepBase/Selectors'
import { FirmwareVersionModel } from '../../Models/FirmwareVersionModel';
import { HardwareVersionModel } from '../../Models/HardwareVersionModel';

// Components
import { FlatList, Text, View, TouchableOpacity, NativeEventEmitter, NativeModules } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import * as Progress from 'react-native-progress';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NavigationButton from '../../Components/NavigationButton';

const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
const BLE_NAME_PREFIX = "BEEPBASE"

type ListItem = Peripheral & { origin: "bonded" | "scanned" }

interface Props {
  navigation: StackNavigationProp,
}

const WizardPairPeripheralScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const [isScanning, setIsScanning] = useState(false);
  const scannedPeripherals = new Map<string, Peripheral>();
  const [list, setList] = useState<Array<ListItem>>([])
  const [bondedPeripherals, setBondedPeripherals] = useState<Array<ListItem>>([])
  const [connectingPeripheral, setConnectingPeripheral] = useState<Peripheral | null>(null)
  const [connectedPeripheral, setConnectedPeripheral] = useState<Peripheral | null>(null)
  const [error, setError] = useState("")
  const firmwareVersion: FirmwareVersionModel = useTypedSelector<FirmwareVersionModel>(getFirmwareVersion)
  const hardwareVersion: HardwareVersionModel = useTypedSelector<HardwareVersionModel>(getHardwareVersion)

  useEffect(() => {
    const BleManagerDiscoverPeripheralSubscription = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
    const BleManagerStopScanSubscription = bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);

    dispatch(BeepBaseActions.setFirmwareVersion(undefined))
    dispatch(BeepBaseActions.setHardwareVersion(undefined))

    //initialize scan result with all previously bonded peripherals
    BleManager.getBondedPeripherals().then((peripherals: Array<Peripheral>) => {
      const filtered: Array<Peripheral> = peripherals.filter((peripheral: Peripheral) => peripheral.name?.startsWith(BLE_NAME_PREFIX))
      const bondedPeripherals: Array<ListItem> = filtered.map((peripheral: Peripheral) => ({ ...peripheral, origin: "bonded" }))
      setBondedPeripherals(bondedPeripherals)
      setList(bondedPeripherals)
      startScan(bondedPeripherals)
    })
    
    return (() => {
      isScanning && BleManager.stopScan()
      
      BleManagerDiscoverPeripheralSubscription && BleManagerDiscoverPeripheralSubscription.remove()
      BleManagerStopScanSubscription && BleManagerStopScanSubscription.remove()
    })
  }, [])


  const scan = (initialPeripherals: Array<ListItem>) => {
    setError("")
    if (!isScanning) {
      setConnectingPeripheral(null)
      BleManager.scan([], 10, false).then((results) => {
        console.log('Scanning...')
        setIsScanning(true)
        setList(initialPeripherals)
      }).catch(err => {
        console.error(err)
        setError(err)
      });
    }
  }

  const startScan = (initialPeripherals: Array<ListItem>) => {
    const initialList = initialPeripherals || bondedPeripherals
    switch (Platform.OS) {
      case "android":
        BleManager.enableBluetooth().then(() => {
          console.log("The bluetooth is already enabled or the user confirmed");
          scan(initialList)
        })
        .catch((error) => {
          console.log("The user refuse to enable bluetooth", error);
          setError("Bluetooth is disabled or not allowed.")
        });
        break;
        
      case "ios":
        scan(initialList)
        break;
    }
  }

  const handleStopScan = () => {
    console.log('Scan is stopped');
    setIsScanning(false);
  }

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    console.log('Found BLE peripheral', peripheral.id, peripheral.name);
    if (peripheral.advertising?.isConnectable) {
      if (!peripheral.name) {
        peripheral.name = peripheral.advertising?.localName;
        if (!peripheral.name) {
          peripheral.name = '(NO NAME)';
        }
      }
      //filter list based on name
      if (peripheral.name.startsWith(BLE_NAME_PREFIX)) {
        scannedPeripherals.set(peripheral.id, { ...peripheral, origin: "scanned" });
        // setList(Array.from(scannedPeripherals.values()));
        setList([...bondedPeripherals, ...Array.from(scannedPeripherals.values())])
      }
    }
  }
  const onPeripheralPress = (peripheral: Peripheral) => {
    setConnectingPeripheral(peripheral)
    dispatch(BeepBaseActions.setFirmwareVersion(undefined))
    dispatch(BeepBaseActions.setHardwareVersion(undefined))
    connectPeripheral(peripheral)
  }

  const connectPeripheral = (peripheral: Peripheral) => {
    console.log("connectPeripheral", peripheral)

    BleManager.stopScan().then(() => {
      setError("")
      BleManager.connect(peripheral.id).then(() => {
        console.log("Connected to " + peripheral.name)

        //store in settings
        const pairedPeripheral = new PairedPeripheralModel({
          id: peripheral.id,
          name: peripheral.name,
        })
        dispatch(BeepBaseActions.setPairedPeripheral(pairedPeripheral))

        //services are needed to subscribe to notifications
        BleHelpers.retrieveServices(peripheral.id).then(() => {
          //beep the buzzer
          BleHelpers.write(peripheral.id, COMMANDS.WRITE_BUZZER_DEFAULT_TUNE, 2)
          //retrieve versions
          BleHelpers.write(peripheral.id, COMMANDS.READ_FIRMWARE_VERSION)
          BleHelpers.write(peripheral.id, COMMANDS.READ_HARDWARE_VERSION)
        })
      })
      .catch((error) => {
        console.log(error)
        setError(error)
        setConnectingPeripheral(null)
      });
    })
  }

  const showNext = !!peripheral && peripheral.isConnected && firmwareVersion
  let showProgress = isScanning || connectingPeripheral != null
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
      if (list.length == 0) {
        message = t("wizard.pair.scanResult_zero")
      } else {
        message = t("wizard.pair.scanResult", { count: list.length })
      }
    }
  }

  const onNextPress = () => {
    navigation.navigate("WizardRegisterScreen")
  }

  const getIcon = (peripheral: ListItem): React.ComponentType<any> | React.ReactElement<any> | null => {
    const iconName = peripheral.origin == "bonded" ? "settings" : "bluetooth"
    let color
    if (peripheral == connectingPeripheral && firmwareVersion && hardwareVersion) {
      color = Colors.bluetooth
    } else {
      color = Colors.lightGrey
    }

    return <Icon name={iconName} size={30} color={color} />
  }

  return (<>
    <ScreenHeader title={t("wizard.pair.screenTitle")} back />

    <View style={styles.container}>

      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{t("wizard.pair.description")}</Text>
      </View>

      <View style={styles.itemContainer}>
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{t("wizard.pair.defaultPin")}</Text>
      </View>

      <View style={styles.spacer} />

      <View style={[styles.messageContainer, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
        <Text style={[styles.text, { textAlign: "center" }]}>{message}</Text>
        { showProgress &&
          <Progress.CircleSnail style={{marginLeft: Metrics.doubleBaseMargin, alignSelf: "center"}} color={Colors.yellow} />
        }
      </View>
      
      <View style={styles.spacer} />

      <FlatList
        data={list}
        renderItem={({ item }) => 
          <NavigationButton 
            title={item.name} 
            subTitle={item == connectingPeripheral && firmwareVersion && hardwareVersion ? t("wizard.pair.subtitleConnected", { firmware: firmwareVersion.toString(), hardware: hardwareVersion.toString() }) : t("wizard.pair.subtitleNotConnected") }
            onPress={() => onPeripheralPress(item)}
            showArrow={false} 
            Icon={getIcon(item)}
            selected={item == connectingPeripheral} 
          />
        }
        keyExtractor={item => item.id}
      />

      { (!isScanning && connectingPeripheral == null && connectedPeripheral == null) && <>
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