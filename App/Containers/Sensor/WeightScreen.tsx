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
import { NavigationProp } from '@react-navigation/native';

// Data
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { SensorDefinitionModel } from '@/App/Models/SensorDefinitionModel';
import { CHANNELS, WeightModel } from '@/App/Models/WeightModel';
import { getPairedPeripheral, getWeight, getFirstWeightSensorDefinition } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  navigation: NavigationProp<any>,
}

const WeightScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const weightSensor: WeightModel = useTypedSelector<WeightModel>(getWeight)
  const weightSensorDefinition = useTypedSelector<SensorDefinitionModel | null>(getFirstWeightSensorDefinition)
  const channel = CHANNELS.find(ch => ch.name == "A_GAIN128")

  const refresh = () => {
    if (pairedPeripheral) {
      //read weight sensor
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_HX711_CONVERSION)
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel?.bitmask, 3])
    }
  }

  useEffect(() => {
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel?.bitmask, 3])
    }
  }, [])

  useInterval(() => {
    refresh()
  }, isFocused ? (__DEV__ ? 3000 : 3000) : null)

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