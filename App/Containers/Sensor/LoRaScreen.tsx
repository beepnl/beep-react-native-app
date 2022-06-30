import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { Colors, Fonts, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import useInterval from '../../Helpers/useInterval';

// Data
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getLoRaWanAppEUI, getLoRaWanAppKey, getLoRaWanDeviceEUI, getLoRaWanState } from '../../Stores/BeepBase/Selectors';
import { BITMASK_ADAPTIVE_DATA_RATE, BITMASK_DUTY_CYCLE_LIMITATION, BITMASK_ENABLED, LoRaWanStateModel } from '../../Models/LoRaWanStateModel';
import { LoRaWanDeviceEUIModel } from '../../Models/LoRaWanDeviceEUIModel';
import { LoRaWanAppEUIModel } from '../../Models/LoRaWanAppEUIModel';
import { LoRaWanAppKeyModel } from '../../Models/LoRaWanAppKeyModel';

// Components
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';

interface Props {
  navigation: StackNavigationProp,
}

const LoRaScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const loRaWanState: LoRaWanStateModel = useTypedSelector<LoRaWanStateModel>(getLoRaWanState)
  const loRaWanDeviceEUI: LoRaWanDeviceEUIModel = useTypedSelector<LoRaWanDeviceEUIModel>(getLoRaWanDeviceEUI)
  const loRaWanAppEUI: LoRaWanAppEUIModel = useTypedSelector<LoRaWanAppEUIModel>(getLoRaWanAppEUI)
  const loRaWanAppKey: LoRaWanAppKeyModel = useTypedSelector<LoRaWanAppKeyModel>(getLoRaWanAppKey)
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    //read state from device
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_ATECC_READ_ID)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_STATE)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_DEVEUI)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_APPEUI)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_APPKEY)
    }
  }, [])

  useEffect(() => {
    if (isResetting) {
      setIsResetting(false)
    }
  }, [loRaWanState])

  useInterval(() => {
    BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_STATE)
  }, 5000)

  const onResetPress = () => {
    if (pairedPeripheral) {
      setIsResetting(true)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_LORAWAN_STATE, BITMASK_ENABLED | BITMASK_ADAPTIVE_DATA_RATE | BITMASK_DUTY_CYCLE_LIMITATION)
    }
  }

  const onConfigurePress = () => {
    navigation.navigate("WizardLoRaScreen", { fromSensorScreen: true })
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

  return (<>
    <ScreenHeader title={t("sensor.lora.screenTitle")} back />

    <ScrollView style={styles.container}>
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("sensor.lora.status")}</Text>
      <View style={styles.spacer} />
      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{getStateText()}</Text>
      </View>

      <View style={styles.spacerDouble} />

      <Text style={styles.label}>{t("sensor.lora.settings")}</Text>
      <View style={styles.spacer} />
      <View style={styles.itemContainer}>
        <Text style={styles.label}>{t("wizard.lora.details.deviceEUI")}</Text>
        <Text style={styles.text}>{loRaWanDeviceEUI?.toString()}</Text>
        <View style={styles.spacer} />
        <Text style={styles.label}>{t("wizard.lora.details.appEUI")}</Text>
        <Text style={styles.text}>{loRaWanAppEUI?.toString()}</Text>
        <View style={styles.spacer} />
        <Text style={styles.label}>{t("wizard.lora.details.appKey")}</Text>
        <Text style={styles.text}>{loRaWanAppKey?.toString()}</Text>
        <View style={styles.spacer} />
        <Text style={styles.label}>{t("wizard.lora.details.ADR")}</Text>
        <Text style={styles.text}>{t(`wizard.lora.details.${loRaWanState?.isAdaptiveDataRateEnabled ? "enabled" : "disabled"}`)}</Text>
        <View style={styles.spacer} />
        <Text style={styles.label}>{t("wizard.lora.details.DCL")}</Text>
        <Text style={styles.text}>{t(`wizard.lora.details.${loRaWanState?.isDutyCycleLimitationEnabled ? "enabled" : "disabled"}`)}</Text>
      </View>

      <View style={styles.spacerDouble} />

      <TouchableOpacity style={styles.button} onPress={onResetPress} disabled={isResetting}>
        <Text style={styles.text}>{t("sensor.lora.reset")}</Text>
      </TouchableOpacity>
      <View style={styles.spacerHalf} />
      { isResetting &&
        <Text style={styles.text}>{t("sensor.lora.resetting")}</Text>
      }
      { !isResetting &&
        <Text style={styles.instructions}>{t("sensor.lora.resetInstructions")}</Text>
      }

      <View style={[styles.spacerDouble, { flex: 1 }]} />

      <TouchableOpacity style={styles.button} onPress={onConfigurePress} >
        <Text style={styles.text}>{t("sensor.configure")}</Text>
      </TouchableOpacity>

      <View style={styles.spacerDouble} />

    </ScrollView>
  </>)
}

export default LoRaScreen