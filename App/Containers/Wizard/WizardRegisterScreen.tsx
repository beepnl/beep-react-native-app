import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import {CommonActions, NavigationProp} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

// Styles
import { Colors } from '@/App/Theme';
import styles from './styles';

// Utils
import BleHelpers, { BLE_NAME_PREFIX, COMMANDS } from '@/App/Helpers/BleHelpers';
import { generateKey } from '@/App/Helpers/random';

// Data
import { AteccModel } from '@/App/Models/AteccModel';
import { DeviceModel } from '@/App/Models/DeviceModel';
import { FirmwareVersionModel } from '@/App/Models/FirmwareVersionModel';
import { HardwareVersionModel } from '@/App/Models/HardwareVersionModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import ApiActions from '@/App/Stores/Api/Actions';
import { RegisterState } from '@/App/Stores/Api/InitialState';
import { getError, getRegisterState } from '@/App/Stores/Api/Selectors';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import { getDevice, getFirmwareVersion, getHardwareId, getHardwareVersion, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  navigation: NavigationProp<any>,
}

const WizardRegisterScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const device: DeviceModel = useTypedSelector<DeviceModel>(getDevice)
  const hardwareId: AteccModel = useTypedSelector<AteccModel>(getHardwareId)
  const registerState: RegisterState = useTypedSelector<RegisterState>(getRegisterState)
  const firmwareVersion: FirmwareVersionModel = useTypedSelector<FirmwareVersionModel>(getFirmwareVersion)
  const hardwareVersion: HardwareVersionModel = useTypedSelector<HardwareVersionModel>(getHardwareVersion)
  const error = useSelector(getError)

  //registration info
  const key = useRef(generateKey(16))
  const suffix = key.current.slice(-4).toUpperCase()
  const [name, setName] = useState(BLE_NAME_PREFIX + suffix)

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
      //if we have the hardware id, check device register state in api
      dispatch(ApiActions.checkDeviceRegistration(peripheral.id, hardwareId))
    }
  }, [hardwareId])

  const onRegisterPress = () => {
    //try registering the peripheral as a new device in the api
    const requestParams = {
      hardware_id: hardwareId.toString(),
      key: key.current,
      name,
      firmware_version: firmwareVersion.toString(),
      hardware_version: hardwareVersion.toString(),
      create_ttn_device: true,
    }
    dispatch(ApiActions.registerDevice(peripheral.id, requestParams))
  }

  const onNextPress = () => {
    //update paired peripheral with current device id
    if (device) {
      dispatch(BeepBaseActions.setPairedPeripheral({ 
        ...peripheral, 
        isConnected: true,
        deviceId: device.id
      }))
    }
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

      { !!error && 
        <View style={styles.itemContainer}>
          <Text style={[styles.itemText, styles.error]}>{error.message}</Text>
        </View>
      }

      { registerState == "notYetRegistered" && <>
        <View style={styles.spacerDouble} />
        <Text style={styles.label}>{t("wizard.register.name")}</Text>
        <View style={styles.spacer} />
        <TextInput
          style={styles.input}
          onChangeText={setName}
          placeholderTextColor={Colors.placeholder}
          value={name}
          maxLength={100}
          returnKeyType="next"
        />
        <View style={styles.spacerDouble} />
        <TouchableOpacity style={styles.button} onPress={onRegisterPress}>
          <Text style={styles.text}>{t("wizard.register.registerButton")}</Text>
        </TouchableOpacity>
      </>}

      <View style={[styles.spacer, { flex: 1 }]} />

      { (registerState == "registered" || registerState == "alreadyRegistered") &&
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