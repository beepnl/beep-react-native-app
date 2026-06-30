import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

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
import { LoRaWanStateModel } from '@/App/Models/LoRaWanStateModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import ApiActions from '@/App/Stores/Api/Actions';
import { LoRaConfigState } from '@/App/Stores/Api/InitialState';
import { getLoRaConfigState } from '@/App/Stores/Api/Selectors';
import { getLoRaWanState, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import useInterval from '@/App/Helpers/useInterval';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const RETRY_COUNT = 36

interface Props {
  navigation: any,
  route: RouteProp<any, any>,
}

const WizardLoRaHeliumScreen: FunctionComponent<Props> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const fromSensorScreen = route.params?.fromSensorScreen
  const state: LoRaConfigState = useTypedSelector<LoRaConfigState>(getLoRaConfigState)
  const retry = useRef(RETRY_COUNT)
  const [startPressed, setStartPressed] = useState(false)

  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const loRaWanState: LoRaWanStateModel = useTypedSelector<LoRaWanStateModel>(getLoRaWanState)
  const pairedPeripheralId = pairedPeripheral?.id

  useEffect(() => {
    dispatch(ApiActions.setLoRaConfigState("none"))
    if (pairedPeripheralId) {
      BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_STATE)
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

  const onStartPress = () => {
    setStartPressed(true)
    retry.current = RETRY_COUNT
    dispatch(ApiActions.configureLoRaHeliumAutomatic())
  }

  const onNextPress = () => {
    navigation.navigate("WizardLoRaOverviewScreen", { fromSensorScreen })
  }

  return (<>
    <ScreenHeader title={t("wizard.lora.heliumAutomatic.screenTitle")} back />

    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.lora.heliumAutomatic.description")}</Text>
      </View>

      <View style={styles.spacerDouble} />

      { (state === "none" || state === "failedToRegister" || state === "failedToConnect" || !startPressed) &&
        <TouchableOpacity style={styles.button} onPress={onStartPress}>
          <Text style={styles.text}>{t("wizard.lora.heliumAutomatic.startButton")}</Text>
        </TouchableOpacity>
      }

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{t(`wizard.lora.heliumAutomatic.state.${state}`)}</Text>
      </View>

      <View style={[styles.spacer, { flex: 1 }]} />

      { state === "connected" &&
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      }
    </ScrollView>
  </>)
}

export default WizardLoRaHeliumScreen
