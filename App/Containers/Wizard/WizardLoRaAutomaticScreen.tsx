import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import {RouteProp, NavigationProp} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import styles from './styles';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import { generateKey } from '@/App/Helpers/random';

// Data
import { LoRaWanStateModel } from '@/App/Models/LoRaWanStateModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import ApiActions from '@/App/Stores/Api/Actions';
import { LoRaConfigState } from '@/App/Stores/Api/InitialState';
import { getLoRaConfigState } from '@/App/Stores/Api/Selectors';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import { getLoRaWanState, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import LoRaConnectionDiagnostics from '@/App/Components/LoRaConnectionDiagnostics';
import useInterval from '@/App/Helpers/useInterval';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const RETRY_COUNT = 8

interface Props {
  navigation: NavigationProp<any>,
  route: RouteProp<any, any>,
}

const WizardLoRaAutomaticScreen: FunctionComponent<Props> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const fromSensorScreen = route.params?.fromSensorScreen
  const state: LoRaConfigState = useTypedSelector<LoRaConfigState>(getLoRaConfigState)
  const retry = useRef(RETRY_COUNT)
  const [startPressed, setStartPressed] = useState(false)
  
  const appKey = useRef(generateKey(32))
  const devEUI = useRef(generateKey(16))

  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const loRaWanState: LoRaWanStateModel = useTypedSelector<LoRaWanStateModel>(getLoRaWanState)

  useEffect(() => {
    dispatch(ApiActions.setLoRaConfigState("none"))
    dispatch(BeepBaseActions.setLoRaWanState(undefined))
    BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_STATE)
  }, [])

  useInterval(() => {
    BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_STATE)
    retry.current = retry.current - 1
    if (retry.current <= 0) {
      dispatch(ApiActions.setLoRaConfigState("failedToConnect"))
    }
  }, (state == "checkingConnectivity") && (retry.current > 0) ? 5000 : null)

  useEffect(() => {
    if (startPressed && state === "checkingConnectivity" && loRaWanState?.hasJoined) {
      dispatch(ApiActions.setLoRaConfigState("connected"))
    }
  }, [dispatch, loRaWanState, startPressed, state])

  const onStartPress = () => {
    setStartPressed(true)
    dispatch(ApiActions.configureLoRaAutomatic(appKey.current, devEUI.current))
    retry.current = RETRY_COUNT
  }

  const onNextPress = () => {
    navigation.navigate("WizardLoRaOverviewScreen", { fromSensorScreen })
  }

  const displayState: LoRaConfigState = startPressed ? state : "none"

  return (<>
    <ScreenHeader title={t("wizard.lora.automatic.screenTitle")} back />

    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.lora.automatic.description")}</Text>
      </View>

      <View style={styles.spacerDouble} />

      { (displayState == "none" || displayState == "failedToRegister" || displayState == "failedToConnect" || !startPressed) &&
        <TouchableOpacity style={styles.button} onPress={onStartPress}>
          <Text style={styles.text}>{t("wizard.lora.automatic.startButton")}</Text>
        </TouchableOpacity>
      }

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{t(`wizard.lora.automatic.state.${displayState}`)}</Text>
      </View>

      { startPressed && state == "connected" &&
        <LoRaConnectionDiagnostics
          loRaWanState={loRaWanState}
          peripheralId={pairedPeripheral?.id}
          isBleConnected={pairedPeripheral?.isConnected}
        />
      }

      <View style={[styles.spacer, { flex: 1 }]} />

      { startPressed && state == "connected" &&
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      }
    </ScrollView>
  </>)
}

export default WizardLoRaAutomaticScreen
