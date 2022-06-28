import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { Colors, Fonts, Images, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import { generateKey } from '../../Helpers/random';
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getDevice, getHardwareId, getLoRaWanAppEUI, getLoRaWanAppKey, getLoRaWanDeviceEUI, getLoRaWanState } from '../../Stores/BeepBase/Selectors';
import { LoRaWanStateModel } from '../../Models/LoRaWanStateModel';
import { LoRaWanDeviceEUIModel } from '../../Models/LoRaWanDeviceEUIModel';
import { LoRaWanAppEUIModel } from '../../Models/LoRaWanAppEUIModel';
import { LoRaWanAppKeyModel } from '../../Models/LoRaWanAppKeyModel';
import { AteccModel } from '../../Models/AteccModel';
import { DeviceModel } from '../../Models/DeviceModel';
import { LoRaConfigState } from '../../Stores/Api/InitialState';
import { getLoRaConfigState } from '../../Stores/Api/Selectors';

// Components
import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useInterval from '../../Helpers/useInterval';

const RETRY_COUNT = 8

interface Props {
  navigation: StackNavigationProp,
}

const WizardLoRaAutomaticScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const state: LoRaConfigState = useTypedSelector<LoRaConfigState>(getLoRaConfigState)
  const retry = useRef(RETRY_COUNT)

  const key = useRef(generateKey(32))

  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const loRaWanState: LoRaWanStateModel = useTypedSelector<LoRaWanStateModel>(getLoRaWanState)
  // const loRaWanDeviceEUI: LoRaWanDeviceEUIModel = useTypedSelector<LoRaWanDeviceEUIModel>(getLoRaWanDeviceEUI)
  // const loRaWanAppEUI: LoRaWanAppEUIModel = useTypedSelector<LoRaWanAppEUIModel>(getLoRaWanAppEUI)
  // const loRaWanAppKey: LoRaWanAppKeyModel = useTypedSelector<LoRaWanAppKeyModel>(getLoRaWanAppKey)
  // const [isDetailsCollapsed, setDetailsCollapsed] = useState(true)

  useEffect(() => {
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
    if (loRaWanState.hasJoined) {
      dispatch(ApiActions.setLoRaConfigState("connected"))
    }
  }, [loRaWanState])

  const onStartPress = () => {
    dispatch(ApiActions.configureLoRaAutomatic(key.current))
    retry.current = RETRY_COUNT
  }

  const onNextPress = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      }),
    );
  }

  return (<>
    <ScreenHeader title={t("wizard.lora.automatic.screenTitle")} back />

    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.lora.automatic.description")}</Text>
      </View>

      <View style={styles.spacerDouble} />

      { (state == "none" || state == "failedToRegister" || state == "failedToConnect") &&
        <TouchableOpacity style={styles.button} onPress={onStartPress}>
          <Text style={styles.text}>{t("wizard.lora.automatic.startButton")}</Text>
        </TouchableOpacity>
      }

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{t(`wizard.lora.automatic.state.${state}`)}</Text>
      </View>

      <View style={[styles.spacer, { flex: 1 }]} />

      { state == "connected" &&
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      }
    </ScrollView>
  </>)
}

export default WizardLoRaAutomaticScreen