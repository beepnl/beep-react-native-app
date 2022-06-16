import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { Colors, Fonts, Images, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import useInterval from '../../Helpers/useInterval';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { TemperatureModel } from '../../Models/TemperatureModel';
import { getTemperatures, getWeight } from 'App/Stores/BeepBase/Selectors';
import { getPairedPeripheral, getDevice } from 'App/Stores/BeepBase/Selectors'
import { DeviceModel } from '../../Models/DeviceModel';
import { CHANNELS, WeightModel } from '../../Models/WeightModel';
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel';
import { getWeightSensorDefinitions } from '../../Stores/BeepBase/Selectors';

// Components
import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import NavigationButton from '../../Components/NavigationButton';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  navigation: StackNavigationProp,
}

const WizardCalibrateScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const device: DeviceModel = useTypedSelector<DeviceModel>(getDevice)
  const temperatures: Array<TemperatureModel> = useTypedSelector<Array<TemperatureModel>>(getTemperatures)
  const weight: WeightModel = useTypedSelector<WeightModel>(getWeight)
  const channel = CHANNELS.find(ch => ch.name == "A_GAIN128")
  const [temperatureSensorsInitialized, setTemperatureSensorsInitialized] = useState(false)
  const [weightSensorInitialized, setWeightSensorInitialized] = useState(false)
  const weightSensorDefinitions: Array<SensorDefinitionModel> = useTypedSelector<Array<SensorDefinitionModel>>(getWeightSensorDefinitions)

  const refresh = () => {
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_DS18B20_CONVERSION)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_HX711_CONVERSION)
    }
  }

  useInterval(() => {
    refresh()
  }, __DEV__ ? 60000 : 5000)

  useEffect(() => {
      //initialize sensors
      if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_DS18B20_CONVERSION, 0xFF])
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel?.bitmask, 1])
    }

    refresh()
  }, [])

  //create temperature sensor definitions if not found in api db
  useEffect(() => {
    if (device && temperatures.length && !temperatureSensorsInitialized) {
      dispatch(ApiActions.initializeTemperatureSensors(device, temperatures))
      setTemperatureSensorsInitialized(true)
    }
  }, [device, temperatures.length])

  //create weight sensor definition if not found in api db
  useEffect(() => {
    if (device && weight && !weightSensorInitialized) {
      dispatch(ApiActions.initializeWeightSensor(device, weight))
      setWeightSensorInitialized(true)
    }
  }, [device, weight])

  const onNextPress = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      }),
    );
  }

  const getWeightTitle = () => {
    const weightSensorDefinition = weightSensorDefinitions[0]
    if (weightSensorDefinition) {
      const sensorChannel = weight.channels.find(ch => ch.bitmask == channel?.bitmask)
      if (sensorChannel) {
        const value = sensorChannel.value
        const offsetValue = Math.max(value - weightSensorDefinition.offset, 0)
        return `${((offsetValue) * weightSensorDefinition.multiplier).toFixed(2)} kg`
      } 
    }

    return weight.toString()
  }

  return (<>
    <ScreenHeader title={t("wizard.calibrate.screenTitle")} back />

    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{t("wizard.calibrate.description")}</Text>
      </View>

      <View style={styles.spacer} />

      { temperatures.length > 0 &&
        <NavigationButton 
          title={temperatures.map((temperatureModel) => temperatureModel.toString()).join(", ")} 
          Icon={<IconFontAwesome name="thermometer-2" size={30} color={Colors.black} />}
          onPress={() => navigation.navigate("CalibrateTemperatureScreen")} 
        />
      }

      { weight &&
        <NavigationButton 
          title={getWeightTitle()} 
          Icon={<IconMaterialCommunityIcons name="scale" size={30} color={Colors.black} />}
          onPress={() => navigation.navigate("CalibrateWeightScreen")} 
        />
      }

      <View style={{ flex: 1, justifyContent: "center" }}>
        <Image style={{ width: Metrics.clientWidth - Metrics.doubleBaseMargin, aspectRatio: 3840/2160, height: null, margin: Metrics.baseMargin }} source={Images.beepBase} resizeMode="contain" />
      </View>

      <TouchableOpacity style={styles.button} onPress={onNextPress}>
        <Text style={styles.text}>{t("common.btnNext")}</Text>
      </TouchableOpacity>
    </ScrollView>
  </>)
}

export default WizardCalibrateScreen