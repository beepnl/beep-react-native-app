import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import styles from './styles';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';

// Data
import { LoRaWanAppEUIModel } from '@/App/Models/LoRaWanAppEUIModel';
import { LoRaWanAppKeyModel } from '@/App/Models/LoRaWanAppKeyModel';
import { LoRaWanDeviceEUIModel } from '@/App/Models/LoRaWanDeviceEUIModel';
import { BITMASK_ADAPTIVE_DATA_RATE, BITMASK_DUTY_CYCLE_LIMITATION, BITMASK_ENABLED, LoRaWanStateModel } from '@/App/Models/LoRaWanStateModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import ApiActions from '@/App/Stores/Api/Actions';
import { LoRaConfigState, LoRaCoverageProvider } from '@/App/Stores/Api/InitialState';
import { getLoRaConfigState } from '@/App/Stores/Api/Selectors';
import { getLoRaWanAppEUI, getLoRaWanAppKey, getLoRaWanDeviceEUI, getLoRaWanState, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import useInterval from '@/App/Helpers/useInterval';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const RETRY_COUNT = 36

interface PreviousLoRaConfig {
  appEui?: string
  appKey?: string
  devEUI?: string
  state: number
}

interface Props {
  navigation: any,
  route: RouteProp<any, any>,
}

const WizardLoRaCoverageCheckScreen: FunctionComponent<Props> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const fromSensorScreen = route.params?.fromSensorScreen
  const provider: LoRaCoverageProvider = route.params?.provider ?? "ttn"
  const state: LoRaConfigState = useTypedSelector<LoRaConfigState>(getLoRaConfigState)
  const retry = useRef(RETRY_COUNT)
  const previousConfig = useRef<PreviousLoRaConfig>()
  const didRestore = useRef(false)
  const [startPressed, setStartPressed] = useState(false)
  const [isRestoring, setRestoring] = useState(false)

  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const loRaWanState: LoRaWanStateModel = useTypedSelector<LoRaWanStateModel>(getLoRaWanState)
  const loRaWanDeviceEUI: LoRaWanDeviceEUIModel = useTypedSelector<LoRaWanDeviceEUIModel>(getLoRaWanDeviceEUI)
  const loRaWanAppEUI: LoRaWanAppEUIModel = useTypedSelector<LoRaWanAppEUIModel>(getLoRaWanAppEUI)
  const loRaWanAppKey: LoRaWanAppKeyModel = useTypedSelector<LoRaWanAppKeyModel>(getLoRaWanAppKey)
  const pairedPeripheralId = pairedPeripheral?.id

  const getLoRaStateMask = (stateToRestore?: LoRaWanStateModel) => {
    let restoredState = 0
    if (stateToRestore?.isEnabled) {
      restoredState |= BITMASK_ENABLED
    }
    if (stateToRestore?.isAdaptiveDataRateEnabled) {
      restoredState |= BITMASK_ADAPTIVE_DATA_RATE
    }
    if (stateToRestore?.isDutyCycleLimitationEnabled) {
      restoredState |= BITMASK_DUTY_CYCLE_LIMITATION
    }
    return restoredState
  }

  const restorePreviousConfig = useCallback(async () => {
    const config = previousConfig.current
    if (!pairedPeripheralId || !config || didRestore.current) {
      return
    }

    didRestore.current = true
    setRestoring(true)

    try {
      const hasPreviousCredentials = config.appEui && config.devEUI && config.appKey
      if (hasPreviousCredentials) {
        await BleHelpers.write(pairedPeripheralId, COMMANDS.WRITE_LORAWAN_APPEUI, config.appEui)
        await BleHelpers.write(pairedPeripheralId, COMMANDS.WRITE_LORAWAN_DEVEUI, config.devEUI)
        await BleHelpers.write(pairedPeripheralId, COMMANDS.WRITE_LORAWAN_APPKEY, config.appKey)
      }
      await BleHelpers.write(pairedPeripheralId, COMMANDS.WRITE_LORAWAN_STATE, hasPreviousCredentials ? config.state : 0)
      await BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_STATE)
      await BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_DEVEUI)
      await BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_APPEUI)
      await BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_APPKEY)
    } finally {
      setRestoring(false)
    }
  }, [pairedPeripheralId])

  useEffect(() => {
    dispatch(ApiActions.setLoRaConfigState("none"))
    if (pairedPeripheralId) {
      BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_STATE)
      BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_DEVEUI)
      BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_APPEUI)
      BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_APPKEY)
    }
  }, [dispatch, pairedPeripheralId])

  useInterval(() => {
    if (pairedPeripheralId) {
      BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_STATE)
    }
    retry.current = retry.current - 1
    if (retry.current <= 0) {
      dispatch(ApiActions.setLoRaConfigState("failedToConnect"))
    }
  }, (state === "checkingConnectivity") && (retry.current > 0) ? 5000 : null)

  useEffect(() => {
    if (state === "checkingConnectivity" && loRaWanState?.hasJoined) {
      dispatch(ApiActions.setLoRaConfigState("connected"))
    }
  }, [dispatch, loRaWanState, state])

  useEffect(() => {
    if (state === "connected" || state === "failedToConnect") {
      restorePreviousConfig()
    }
  }, [restorePreviousConfig, state])

  const onStartPress = () => {
    setStartPressed(true)
    retry.current = RETRY_COUNT
    didRestore.current = false
    previousConfig.current = {
      appEui: loRaWanAppEUI?.appEUI,
      appKey: loRaWanAppKey?.appKey,
      devEUI: loRaWanDeviceEUI?.devEUI,
      state: getLoRaStateMask(loRaWanState),
    }
    dispatch(ApiActions.configureLoRaCoverageCheck(provider))
  }

  const onNextPress = () => {
    navigation.navigate("WizardLoRaOverviewScreen", { fromSensorScreen })
  }

  return (<>
    <ScreenHeader title={t(`wizard.lora.coverage.${provider}.screenTitle`)} back />

    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t(`wizard.lora.coverage.${provider}.description`)}</Text>
      </View>

      <View style={styles.spacerDouble} />

      { (state === "none" || state === "failedToRegister" || state === "failedToConnect" || !startPressed) &&
        <TouchableOpacity style={styles.button} onPress={onStartPress}>
          <Text style={styles.text}>{t("wizard.lora.coverage.startButton")}</Text>
        </TouchableOpacity>
      }

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{isRestoring ? t("wizard.lora.coverage.restoring") : t(`wizard.lora.coverage.state.${state}`)}</Text>
      </View>

      { state === "connected" && <>
        <View style={styles.spacerDouble} />
        <View style={styles.itemContainer}>
          <Text style={styles.text}>{t("wizard.lora.coverage.success")}</Text>
        </View>
      </>}

      <View style={[styles.spacer, { flex: 1 }]} />

      { state === "connected" &&
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      }
    </ScrollView>
  </>)
}

export default WizardLoRaCoverageCheckScreen
