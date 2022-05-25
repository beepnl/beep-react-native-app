import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { ApplicationStyles, Colors, Fonts, Metrics } from '../../Theme';

// Utils
import BleHelpers, { BluetoothState } from '../../Helpers/BleHelpers';
import BleManager from 'react-native-ble-manager'
import { NativeModules, NativeEventEmitter, SafeAreaView } from "react-native";

// Redux
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripherals } from 'App/Stores/Settings/Selectors'

// Components
import { ScrollView, Text, View } from 'react-native';
import BluetoothLogo from 'App/Assets/Images/BluetoothLogo'

const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);

interface Props {
}

const WizardBluetoothScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [bleState, setBleState] = useState<string>("off")
  const pairedPeripherals: Array<PairedPeripheralModel> = useTypedSelector<Array<PairedPeripheralModel>>(getPairedPeripherals)
  const bluetoothState: BluetoothState = BleHelpers.getBluetoothState(bleState, pairedPeripherals)

  useEffect(() => {
    const BleManagerDidUpdateStateSubscription = bleManagerEmitter.addListener("BleManagerDidUpdateState", (args) => {
     setBleState(args.state)
    });

    BleManager.checkState()

    return (() => {
      BleManagerDidUpdateStateSubscription && BleManagerDidUpdateStateSubscription.remove()
    })
  }, [])

  useEffect(() => {
    if (bleState == "on") {
      // navigation.navigate("WizardPairPeripheralScreen")
    } else {
    }
  }, [bleState])

  const onNextPress = () => {
    if (bleState == "unsupported") {
      if (__DEV__) {
        setBleState("on")
      }
    } else if (bleState == "on") {
      navigation.navigate("WizardPairPeripheralScreen")
    } else {
      BleHelpers.enableBluetooth()?.
      catch(error => {
        console.log("Error enabling bluetooth. Error: ", error)
      })
    }
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <ScrollView>

        <View style={styles.spacerDouble} />

        <View style={styles.itemContainer}>
        </View>

        <View style={styles.spacer} />

        { bleState == "unsupported" && <>
          <View style={styles.itemContainer}>
            <Text style={styles.itemText}>{t("wizard.bluetooth.unsupported")}</Text>
          </View>
        </>}

        { bleState != "unsupported" && <>
          <View style={styles.itemContainer}>
            <Text style={styles.itemText}>{t("wizard.bluetooth.description")}</Text>
          </View>
        </>}

        <View style={styles.centeredContainer}>
          <View style={styles.spacer} />
          <BluetoothLogo backgroundColor={BleHelpers.getBluetoothColor(bluetoothState)} />
          <View style={styles.spacer} />
        </View>

        { bleState != "unsupported" && bleState != "on" && <>
          <View style={styles.itemContainer}>
            <Text style={styles.itemText}>{t("wizard.bluetooth.ask")}</Text>
          </View>
        </>}

        { bleState == "on" && <>
          <View style={styles.itemContainer}>
            <Text style={styles.itemText}>{t("wizard.bluetooth.on")}</Text>
          </View>
        </>}

        <View style={styles.spacerDouble} />

        {/* { (bleState != "unsupported" || __DEV__) && <>
          <Button 
            size="small" 
            shadow={false}
            title={t("common.btnNext")}
            onPress={onNextPress} 
          />
        </>} */}

      </ScrollView>
    </SafeAreaView>
  )
}

export default WizardBluetoothScreen