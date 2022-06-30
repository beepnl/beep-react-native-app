import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
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
import { TemperatureModel } from '../../Models/TemperatureModel';
import { getTemperatures } from 'App/Stores/BeepBase/Selectors';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel';
import { getTemperatureSensorDefinitions } from '../../Stores/BeepBase/Selectors';

// Components
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';

interface Props {
  navigation: StackNavigationProp,
}

const TemperatureScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const temperatureSensors: Array<TemperatureModel> = useTypedSelector<Array<TemperatureModel>>(getTemperatures)
  const temperatureSensorDefinitions: Array<SensorDefinitionModel> = useTypedSelector<Array<SensorDefinitionModel>>(getTemperatureSensorDefinitions)
  const isCalibrated = temperatureSensors.length == temperatureSensorDefinitions.length

  const refresh = () => {
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_DS18B20_CONVERSION, 0xFF])
      // BleHelpers.write(currentPeripheral.id, COMMAND_READ_DS18B20_CONVERSION)
    }
  }

  useEffect(() => {
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_DS18B20_CONVERSION)
    }
    // refresh()
  }, [])

  useInterval(() => {
    refresh()
  }, 5000)

  const onConfigurePress = () => {
    navigation.navigate("CalibrateTemperatureScreen")
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

      <View style={[styles.spacer, { flex: 1 }]} />

      <TouchableOpacity style={styles.button} onPress={onConfigurePress} >
        <Text style={styles.text}>{t("sensor.configure")}</Text>
      </TouchableOpacity>

    </View>
  </>)
}

export default TemperatureScreen