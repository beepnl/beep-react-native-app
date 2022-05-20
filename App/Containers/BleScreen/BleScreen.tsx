import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './BleScreenStyle'
import { ApplicationStyles, Colors, Fonts, Metrics } from '../../Theme';

// Utils
import BleManager, { disconnect, Peripheral, stopScan } from 'react-native-ble-manager'
import { NativeModules, NativeEventEmitter, PermissionsAndroid, PermissionStatus } from "react-native";
import { Platform, FlatList, TouchableHighlight } from "react-native";
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';

// Redux
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { getPairedPeripherals } from 'App/Stores/Settings/Selectors'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';

// Components
import { ScrollView, Text, View } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import Button from '../../Components/Button';
import Modal from 'react-native-modal';
import Keypad from '../../Components/Keypad';
import * as Progress from 'react-native-progress';

const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);

interface Props {
  showScreenHeader: boolean,
  onPaired?: () => void,
}

const BleScreen: FunctionComponent<Props> = ({
  showScreenHeader = true,
  onPaired,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  // if (navigation.state.params?.onPaired) {
  //   onPaired = navigation.state.params?.onPaired
  // }
  const [isScanning, setIsScanning] = useState(false);
  const peripherals = new Map<string, Peripheral>();
  const [list, setList] = useState([]);
  const [isKeypadModalVisible, setKeypadModalVisible] = useState(false)
  const [connectingPeripheral, setConnectingPeripheral] = useState<Peripheral | null>(null)
  const [connectedPeripheral, setConnectedPeripheral] = useState<Peripheral | null>(null)
  const [error, setError] = useState("")
  const pairedPeripherals: Array<PairedPeripheralModel> = useTypedSelector<Array<PairedPeripheralModel>>(getPairedPeripherals)

  useEffect(() => {
    const BleManagerDiscoverPeripheralSubscription = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
    const BleManagerStopScanSubscription = bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);

    // if (pairedPeripherals.length > 0) {
    //   BleHelpers.disconnectPeripheral(pairedPeripherals[0])
    // }
    startScan()

    return (() => {
      isScanning && BleManager.stopScan()

      BleManagerDiscoverPeripheralSubscription && BleManagerDiscoverPeripheralSubscription.remove()
      BleManagerStopScanSubscription && BleManagerStopScanSubscription.remove()
    })
  }, []);

  const startScan = () => {
    function scan() {
      setError("")
      if (!isScanning) {
        setConnectingPeripheral(null)
        BleManager.scan([], 10, false).then((results) => {
          console.log('Scanning...');
          setIsScanning(true);
          // setList([])
          setList(pairedPeripherals)      //also show current peripheral in the scan result to allow reconnect
        }).catch(err => {
          console.error(err);
          setError(err)
        });
      }
    }

    switch (Platform.OS) {
      case "android":
        BleManager.enableBluetooth().then(() => {
          console.log("The bluetooth is already enabled or the user confirmed");
          scan()
        })
        .catch((error) => {
          console.log("The user refuse to enable bluetooth", error);
        });
        break;
        
      case "ios":
        scan()
        break;
    }
 
  }

  const showKeypad = () => {
    setKeypadModalVisible(true)
  }

  const hideKeypad = () => {
    setKeypadModalVisible(false)
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
      if (peripheral.name.startsWith("BEEPBASE")) {
        peripherals.set(peripheral.id, peripheral);
        setList(Array.from(peripherals.values()));
      }
    }
  }

  const tryConnectPeripheral = (peripheral: Peripheral) => {
    console.log("tryConnectPeripheral", peripheral)
    setConnectingPeripheral(peripheral)
    if (Platform.OS == "android") {
      // showKeypad()
      connectPeripheral(peripheral, "123456")
    } else if (Platform.OS == "ios") {
      connectPeripheral(peripheral)
    }
  }
  
  const onKeypadOk = (pinCode: string) => {
    console.log("onKeypadOk", connectingPeripheral, pinCode)
    hideKeypad()
    // if (connectingPeripheral && pinCode) { //DO NOT COMMIT
    if (connectingPeripheral) {
      connectPeripheral(connectingPeripheral, pinCode)
    }
  }

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const connectPeripheral = (peripheral: Peripheral, pinCode?: string) => {
    console.log("connectPeripheral", peripheral, pinCode)

    BleManager.stopScan().then(() => {
      setError("")
      BleManager.connect(peripheral.id).then(() => {
        console.log("Connected to " + peripheral.name)
        //update UI
        setConnectingPeripheral(null)
        setConnectedPeripheral(peripheral)
  
        //pair on Android
        if (Platform.OS == "android") {
          // delay(500).then(() => {
            // BleManager.createBond(peripheral.id, pinCode)
            // .then(() => {
              // console.log("createBond success or there is already an existing one");
              const pairedPeripheral = new PairedPeripheralModel({
                id: peripheral.id,
                name: peripheral.name,
                isConnected: true,
              })
              //store in settings
              dispatch(BeepBaseActions.setPairedPeripheral(pairedPeripheral))
              if (onPaired) {
                //let caller decide next action
                // onPaired()
              } else {
                //default close screen
                // navigation.goBack()
              }
            // })
            // .then(() => {
              // delay(500).then(() => {
                BleHelpers.retrieveServices(peripheral.id)
              // })
            // })
            // .catch((error) => {
            //   console.log("failed to bond. Error = " + error);
            //   setConnectingPeripheral(null)
            //   setError(error)
            // });
          // })
        }
  
        //pair on iOS
        else if (Platform.OS == "ios") {
          setTimeout(() => {  //TODO: use delay
            BleHelpers.retrieveServices(peripheral.id).then(() => {
              //writing the first value triggers the pair popup for pin code on iOS
              BleHelpers.write(peripheral.id, COMMANDS.TRIGGER_PINCODE).then(() => {
                //update UI
                setConnectingPeripheral(null)
                setConnectedPeripheral(peripheral)

                //store in settings
                const pairedPeripheral = new PairedPeripheralModel({
                  id: peripheral.id,
                  name: peripheral.name,
                  isConnected: true,
                })
                dispatch(BeepBaseActions.setPairedPeripheral(pairedPeripheral))

                if (onPaired) {
                  //let caller decide next action
                  onPaired()
                } else {
                  //default close screen
                  navigation.goBack()
                }
              })
            })
          }, 500);
        }
      })
      .catch((error) => {
        console.log(error);
        setError(error)
      });
    })
  }

  const renderItem = (peripheral: Peripheral, onPress: () => void) => {
    return (
      <TouchableHighlight 
        onPress={() => onPress(peripheral) }
        key={peripheral.id}
      >
        <View style={styles.itemContainer}>
          <Text style={{fontSize: 18, textAlign: 'center', color: Colors.text, padding: 2}}>{peripheral.name}</Text>
          <Text style={{fontSize: 14, textAlign: 'center', color: Colors.text, padding: 2}}>RSSI: {peripheral.rssi}</Text>
          <Text style={{fontSize: 14, textAlign: 'center', color: Colors.text, padding: 2, paddingBottom: 20}}>{peripheral.id}</Text>
        </View>
      </TouchableHighlight>
    );
  }

  let message
  if (isScanning) {
    message = t("ble.scanning")
  } else {
    if (connectingPeripheral != null || connectedPeripheral != null) {
      message = t("ble.connecting")
    } else {
      if (list.length == 0) {
        message = t("ble.noResult")
      } else {
        message = t("ble.select")
      }
    }
  }

  return (
    <View style={styles.mainContainer}>

      {showScreenHeader && <>
        <ScreenHeader title={t("ble.screenTitle")} back />
        <View style={styles.spacer} />
      </>}

      <View style={styles.messageContainer}>
        <Text style={[styles.text, { textAlign: "center" }]}>{message}</Text>
        { (isScanning || connectingPeripheral != null || connectedPeripheral != null) &&
          <Progress.CircleSnail style={{marginLeft: Metrics.doubleBaseMargin, alignSelf: "center"}} color={Colors.green} />
        }
      </View>
      
      { (!isScanning && connectingPeripheral == null && connectedPeripheral == null) && <>
        <View style={styles.spacerDouble} />
        <Button 
          size="small" 
          shadow={false}
          title={t("ble.retry")}
          onPress={startScan} 
        />
      </>
      }

      { !!error && <>
        <View style={styles.messageContainer}>
          <Text style={styles.text}>{`Error: ${error}`}</Text>
        </View>
      </>}

      <FlatList
        style={{ height: 100, alignSelf: "center" }}
        data={list}
        renderItem={({ item }) => renderItem(item, tryConnectPeripheral) }
        keyExtractor={item => item.id}
      />

      <Modal
        isVisible={isKeypadModalVisible}
        onBackdropPress={hideKeypad}
        onBackButtonPress={hideKeypad}
        useNativeDriver={true}
        backdropOpacity={0.3}
      >
        <View style={ApplicationStyles.modalContainer}>
          <Keypad
            title={t("ble.keypadTitle")}
            onOkPress={onKeypadOk}
          />
        </View>
      </Modal>

    </View>
  )
}

export default BleScreen