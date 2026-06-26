import React, { FunctionComponent, useEffect } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import {RouteProp, StackActions, NavigationProp} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { Colors, Fonts } from '@/App/Theme';
import styles from './styles';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';

// Data
import { DeviceModel } from '@/App/Models/DeviceModel';
import { LoRaWanAppEUIModel } from '@/App/Models/LoRaWanAppEUIModel';
import { LoRaWanAppKeyModel } from '@/App/Models/LoRaWanAppKeyModel';
import { LoRaWanDeviceEUIModel } from '@/App/Models/LoRaWanDeviceEUIModel';
import { LoRaWanStateModel } from '@/App/Models/LoRaWanStateModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { getDevice, getLoRaWanAppEUI, getLoRaWanAppKey, getLoRaWanDeviceEUI, getLoRaWanState, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import LoRaConnectionDiagnostics from '@/App/Components/LoRaConnectionDiagnostics';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  navigation: NavigationProp<any>,
  route: RouteProp<any, any>,
}

const WizardLoRaOverviewScreen: FunctionComponent<Props> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const fromSensorScreen = route.params?.fromSensorScreen
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const device: DeviceModel = useTypedSelector<DeviceModel>(getDevice)
  const loRaWanState: LoRaWanStateModel = useTypedSelector<LoRaWanStateModel>(getLoRaWanState)
  const loRaWanDeviceEUI: LoRaWanDeviceEUIModel = useTypedSelector<LoRaWanDeviceEUIModel>(getLoRaWanDeviceEUI)
  const loRaWanAppEUI: LoRaWanAppEUIModel = useTypedSelector<LoRaWanAppEUIModel>(getLoRaWanAppEUI)
  const loRaWanAppKey: LoRaWanAppKeyModel = useTypedSelector<LoRaWanAppKeyModel>(getLoRaWanAppKey)

  useEffect(() => {
    //read state from device
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_STATE)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_DEVEUI)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_APPEUI)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_APPKEY)
    }
  }, [])

  const onNextPress = () => {
    if (fromSensorScreen) {
      //go back to Sensor/LoRaScreen
      navigation.dispatch(StackActions.pop(3))
    } else {
      //continue wizard
      navigation.navigate("WizardEnergyScreen")
    }
  }

  const getStateText = () => {
    if (loRaWanState) {
      if (loRaWanState.isEnabled) {
        if (loRaWanState.hasJoined) {
          return t("wizard.lora.state.enabledJoined")
        } else {
          return t("wizard.lora.state.enabledNotJoined")
        }
      } else {
        return t("wizard.lora.state.disabled")
      }
    } else {
      return t("wizard.lora.state.reading")
    }
  }

  const renderDetails = () => (
    <View style={styles.itemContainer}>
      <Text style={styles.label}>{t("wizard.lora.details.deviceEUI")}</Text>
      <Text style={styles.text}>{loRaWanDeviceEUI?.toString()}</Text>
      <View style={styles.spacer} />
      <Text style={styles.label}>{t("wizard.lora.details.appEUI")}</Text>
      <Text style={styles.text}>{loRaWanAppEUI?.toString()}</Text>
      <View style={styles.spacer} />
      <Text style={styles.label}>{t("wizard.lora.details.appKey")}</Text>
      <Text style={styles.text}>{loRaWanAppKey?.toString()}</Text>
    </View>
  )

  return (<>
    <ScreenHeader title={t("wizard.lora.screenTitle")} back />

    <ScrollView style={styles.container}>

      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{t("wizard.lora.loraState")}</Text>
        <View style={styles.spacer} />
        <View style={styles.centeredContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="radio-outline" size={30} color={ (loRaWanState?.isEnabled && loRaWanState?.hasJoined) ? Colors.green : Colors.red } style={{ transform: [{ rotate: '90deg'}] }} />
            <Text style={styles.itemText}>{getStateText()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.spacerDouble} />
      <View style={styles.centeredContainer}>
        <Text style={styles.centeredText}>{t("wizard.lora.deviceName")}</Text>
        <View style={styles.spacerHalf} />
        <Text style={[styles.text]}>{device?.name}</Text>
      </View>
      <View style={styles.spacerDouble} />
      <View style={styles.centeredContainer}>
        <Text style={styles.centeredText}>{t("wizard.lora.oldBluetoothName")}</Text>
        <View style={styles.spacerHalf} />
        <Text style={[styles.text]}>{`${DeviceModel.getPreviousBleName(device)}`}</Text>
      </View>
      <View style={styles.spacerDouble} />
      <View style={styles.centeredContainer}>
        <Text style={styles.centeredText}>{t("wizard.lora.newBluetoothName")}</Text>
        <View style={styles.spacerHalf} />
        <Text style={[styles.text, { ...Fonts.style.bold }]}>{`${DeviceModel.getBleName(device)}`}</Text>
      </View>
      <View style={styles.spacerDouble} />

      { loRaWanState?.hasJoined && <>
        <LoRaConnectionDiagnostics
          loRaWanState={loRaWanState}
          peripheralId={pairedPeripheral?.id}
          isBleConnected={pairedPeripheral?.isConnected}
        />

        { renderDetails() }

        <View style={styles.spacerDouble} />

        <View style={styles.itemContainer}>
          <Text style={styles.text}>{t("wizard.lora.descriptionJoined")}</Text>
        </View>

        <View style={styles.spacer} />
      </>}

    </ScrollView>

    { loRaWanState?.hasJoined && <>
      <View style={styles.itemContainer}>
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      </View>
    </>}

  </>)
}

export default WizardLoRaOverviewScreen
