import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { Colors, Fonts, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getHardwareId } from 'App/Stores/BeepBase/Selectors'
import { getRegisterState } from 'App/Stores/Api/Selectors'
import { AteccModel } from '../../Models/AteccModel';
import { RegisterState } from '../../Stores/Api/InitialState';
import { getFirmwareVersion, getHardwareVersion } from '../../Stores/BeepBase/Selectors';
import { FirmwareVersionModel } from '../../Models/FirmwareVersionModel';
import { HardwareVersionModel } from '../../Models/HardwareVersionModel';

// Components
import { Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NavigationButton from '../../Components/NavigationButton';

interface Props {
  navigation: StackNavigationProp,
}

const WizardRegisterScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const hardwareId: AteccModel = useTypedSelector<AteccModel>(getHardwareId)
  const registerState: RegisterState = useTypedSelector<RegisterState>(getRegisterState)
  const firmwareVersion: FirmwareVersionModel = useTypedSelector<FirmwareVersionModel>(getFirmwareVersion)
  const hardwareVersion: HardwareVersionModel = useTypedSelector<HardwareVersionModel>(getHardwareVersion)

  useEffect(() => {
    if (peripheral && peripheral.isConnected) {
      dispatch(ApiActions.setRegisterState("hardwareId"))
      //read hardware id from peripheral
      BleHelpers.write(peripheral.id, COMMANDS.READ_ATECC_READ_ID)
    } else {
      navigation.goBack()
    }
  }, [])

  useEffect(() => {
    if (hardwareId?.id && firmwareVersion && hardwareVersion) {
      //if we have the hardware id, try registering the peripheral as a new device in the api
      const requestParams = {
        hardware_id: hardwareId.toString(),
        name: peripheral.name,
        firmware_version: firmwareVersion.toString(),
        hardware_version: hardwareVersion.toString(),
        create_ttn_device: true,
      }
      dispatch(ApiActions.registerDevice(hardwareId, requestParams))
    }
  }, [hardwareId])

  const onNextPress = () => {
    navigation.navigate("WizardCalibrateScreen")
  }

  const onFinishPress = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      }),
    );
  }

  return (<>
    <ScreenHeader title={t("wizard.register.screenTitle")} back />

    <View style={styles.container}>

      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{t(`wizard.register.state.${registerState}`)}</Text>
      </View>

      <View style={[styles.spacer, { flex: 1 }]} />

      { registerState == "registered" || registerState == "alreadyRegistered" &&
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      }

      { (registerState == "deviceAlreadyLinkedToAnotherAccount" || registerState == "failed") &&
        <TouchableOpacity style={styles.button} onPress={onFinishPress}>
          <Text style={styles.text}>{t("common.btnFinish")}</Text>
        </TouchableOpacity>
      }

    </View>
  </>)
}

export default WizardRegisterScreen