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
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel';
import { getWeight, getWeightSensorDefinitions } from '../../Stores/BeepBase/Selectors';
import { CHANNELS, WeightModel } from '../../Models/WeightModel';

// Components
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';

interface Props {
  navigation: StackNavigationProp,
}

const WeightScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const weightSensor: WeightModel = useTypedSelector<WeightModel>(getWeight)
  const weightSensorDefinitions: Array<SensorDefinitionModel> = useTypedSelector<Array<SensorDefinitionModel>>(getWeightSensorDefinitions)
  const isCalibrated = weightSensorDefinitions.length > 0
  const weightSensorDefinition = weightSensorDefinitions[0]
  const channel = CHANNELS.find(ch => ch.name == "A_GAIN128")

  const refresh = () => {
    if (pairedPeripheral) {
      //read weight sensor
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_HX711_CONVERSION)
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel?.bitmask, 10])
    }
  }

  useEffect(() => {
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel?.bitmask, 10])
    }
  }, [])

  useInterval(() => {
    refresh()
  }, __DEV__ ? 20000 : 10000)

  const onConfigurePress = () => {
    navigation.navigate("CalibrateWeightScreen")
  }

  const getWeightTitle = () => {
    if (weightSensorDefinition) {
      const sensorChannel = weightSensor?.channels.find(ch => ch.bitmask == channel?.bitmask)
      if (sensorChannel) {
        const value = sensorChannel.value
        const offsetValue = Math.max(value - weightSensorDefinition.offset, 0)
        return `${((offsetValue) * weightSensorDefinition.multiplier).toFixed(2)} kg`
      } 
    }

    return weightSensor?.toString()
  }

  return (<>
    <ScreenHeader title={t("sensor.weight.screenTitle")} back />

    <View style={styles.container}>
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("sensor.currentReading")}</Text>

      <View style={styles.spacer} />

      <View style={[styles.itemContainer, { flex: 0 }]}>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.weight.sensorName")}</Text>
          <Text style={styles.text}>{getWeightTitle()}</Text>
        </View>
      </View>

      <View style={styles.spacerDouble} />

      <Text style={styles.label}>{t("sensor.calibration")}</Text>

      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.weight.raw")}</Text>
          <Text style={styles.text}>{weightSensor ? weightSensor.channels[0]?.value : "- kg"}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.weight.offset")}</Text>
          <Text style={styles.text}>{weightSensorDefinition?.offset ? weightSensorDefinition.offset.toString() : "-"}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.weight.multiplier")}</Text>
          <Text style={styles.text}>{weightSensorDefinition?.multiplier ? weightSensorDefinition.multiplier.toString() : "-"}</Text>
        </View>
      </View>

      <View style={[styles.spacer, { flex: 1 }]} />

      <TouchableOpacity style={styles.button} onPress={onConfigurePress} >
        <Text style={styles.text}>{t("sensor.configure")}</Text>
      </TouchableOpacity>

    </View>
  </>)
}

export default WeightScreen