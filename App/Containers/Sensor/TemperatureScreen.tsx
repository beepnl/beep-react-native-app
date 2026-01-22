import React, { FunctionComponent, useEffect } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import styles from './styles';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import useInterval from '@/App/Helpers/useInterval';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Data
import { DeviceModel } from '@/App/Models/DeviceModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { SensorDefinitionModel } from '@/App/Models/SensorDefinitionModel';
import { TemperatureModel } from '@/App/Models/TemperatureModel';
import ApiActions from '@/App/Stores/Api/Actions';
import { getPairedPeripheral, getTemperatures, getTemperatureSensorDefinitions } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import { Text, TouchableOpacity, View } from 'react-native';

export type SensorScreenNavigationParams = {
  device: DeviceModel,
}

type Props = NativeStackScreenProps<SensorScreenNavigationParams>

const TemperatureScreen: FunctionComponent<Props> = ({
  route,
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const device: DeviceModel = route.params?.device
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const temperatureSensors: Array<TemperatureModel> = useTypedSelector<Array<TemperatureModel>>(getTemperatures)
  const temperatureSensorDefinitions: Array<SensorDefinitionModel> = useTypedSelector<Array<SensorDefinitionModel>>((state: any) => getTemperatureSensorDefinitions(state, temperatureSensors.length))
  const isCalibrated = temperatureSensors.length == temperatureSensorDefinitions.length

  const refresh = () => {
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_DS18B20_STATE)
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_DS18B20_CONVERSION, 0xFF])
    }
  }

  useEffect(() => {
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_DS18B20_STATE)
    }
  }, [])

  useInterval(() => {
    refresh()
  }, isFocused ? (__DEV__ ? 20000 : 5000) : null)

  const onConfigurePress = () => {
    if (!isCalibrated) {
      dispatch(ApiActions.initializeTemperatureSensors(device, temperatureSensors, "CalibrateTemperatureScreen"))
    } else {
      navigation.navigate("CalibrateTemperatureScreen")
    }
  }

  let message = ""
  if (temperatureSensors.length == 0) {
    //no hardware sensor
    message = t("sensor.noSensor")
  } else if (!isCalibrated) {
    //hardware sensor count differs from sensor definition count
    if (temperatureSensorDefinitions.length == 0) {
      //no definition in api db
      message = t("sensor.noSensorDefinition")
    } else if (temperatureSensors.length > temperatureSensorDefinitions.length) {
      message = t("sensor.newSensor")
    }
  }

  return (<>
    <ScreenHeader title={t("sensor.temperature.screenTitle")} back />

    <View style={styles.container}>
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("sensor.currentReading")}</Text>

      <View style={styles.spacer} />

      { isCalibrated && temperatureSensors.map((temperatureModel, index) => <View key={index}>
          <View style={styles.itemContainer}>
            <View style={styles.itemRow}>
              <Text style={styles.text}>{temperatureSensorDefinitions[index].name}</Text>
              <Text style={styles.text}>{temperatureModel.toString()}</Text>
            </View>
            <Text style={styles.text}>{t("sensor.temperature.location") + t(`sensor.temperature.${temperatureSensorDefinitions[index].isInside ? "inside" : "outside"}`)}</Text>
          </View>
          <View style={styles.spacerDouble} />
      </View>)}

      { !!message && <>
        <View style={styles.spacerDouble} />
        <Text style={styles.text}>{message}</Text>        
      </>}

      <View style={[styles.spacer, { flex: 1 }]} />

      <TouchableOpacity style={styles.button} onPress={onConfigurePress} >
        <Text style={styles.text}>{t("sensor.configure")}</Text>
      </TouchableOpacity>

    </View>
  </>)
}

export default TemperatureScreen