import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
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
import { getTemperatureSensorDefinitions, getTemperatures } from 'App/Stores/BeepBase/Selectors';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel';
import { getWeight } from '../../Stores/BeepBase/Selectors';
import { CHANNELS, WeightModel } from '../../Models/WeightModel';

// Components
import { ScrollView, Text, View, TouchableOpacity, Image, TextInput } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';

type PAGE = "tare" | "calibrate"

type STATE = 
  "tareIdle" |
  "sampling" |
  "tareCompleted" |
  "tareDeviationTooLarge" |
  "calibrateIdle" |
  "calibrateCompleted" |
  "calibrateDeviationTooLarge" |
  "timeout"

interface Props {
  navigation: StackNavigationProp,
}

const CalibrateWeightScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const weight: WeightModel = useTypedSelector<WeightModel>(getWeight)
  const channel = CHANNELS.find(ch => ch.name == "A_GAIN128")?.bitmask
  const weightSensorDefinitions: Array<SensorDefinitionModel> = useTypedSelector<Array<SensorDefinitionModel>>(getTemperatureSensorDefinitions)
  const [page, setPage] = useState<PAGE>("tare")
  const [state, setState] = useState<STATE>("tareIdle")

  const [readings, setReadings] = useState<Array<number>>([])
  const [offset, setOffset] = useState(0)

  const [calibrateWeight, setCalibrateWeight] = useState(0)
  const [consecutiveDeviationErrors, setConsecutiveDeviationErrors] = useState(0)
  const [multiplier, setMultiplier] = useState(0)

  const REQUIRED_CONSECUTIVE_READINGS = 3
  const TARE_ALLOWED_PERCENTUAL_DEVIATION = 0.3
  const CALIBRATE_ALLOWED_PERCENTUAL_DEVIATION = 1.0
  const ALLOWED_CONSECUTIVE_DEVIATION_ERRORS = 3

  const refresh = () => {
    if (pairedPeripheral) {
      //read weight sensor
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_HX711_CONVERSION)
    }
  }

  useEffect(() => {
    // if (temperatures.length === temperatureSensorDefinitions.length) {
    //   temperatureSensorDefinitions.forEach((sensorDefinition: SensorDefinitionModel, index: number) => {
    //     //overwrite sensor props with values from api
    //     names[index].setValue(sensorDefinition.name)
    //     sensorLocations[index].setValue(sensorDefinition.isInside)
    //   })
    // } else {
    //   //illegal state, device sensor count differs from api sensor count
    //   navigation.goBack()
    // }

    // refresh()
  }, [])

  useInterval(() => {
    refresh()
  }, __DEV__ ? 5000 : 5000)

  useEffect(() => {
    if (state == "sampling" && weight) {
      const newReadings = [...readings, weight.channels[0].value]
      setReadings(newReadings)

      if (newReadings.length) {
        let min: number | undefined = undefined
        let max: number | undefined = undefined
        let sum = 0
        newReadings.forEach((reading: number) => {
          if (min == undefined || reading < min) {
            min = reading
          } 
          if (max == undefined || reading > max) {
            max = reading
          }
          sum += reading
        })
        const average = sum / newReadings.length
        const spread = max - min
        const percentualDeviation = spread / average * 100

        const allowedPercentualDeviation = page == "tare" ? TARE_ALLOWED_PERCENTUAL_DEVIATION : CALIBRATE_ALLOWED_PERCENTUAL_DEVIATION
        if (percentualDeviation > allowedPercentualDeviation) {
          if (page == "tare") {
            //stop on first deviation
            setState("tareDeviationTooLarge")
          } else if (page == "calibrate") {
            //collect max number of deviations before stopping
            setConsecutiveDeviationErrors(consecutiveDeviationErrors + 1)
            if (consecutiveDeviationErrors > ALLOWED_CONSECUTIVE_DEVIATION_ERRORS) {
              setState("calibrateDeviationTooLarge")
            }
          }
          return
        }

        if (newReadings.length >= REQUIRED_CONSECUTIVE_READINGS) {
          if (page == "tare") {
            setOffset(Math.round(average))
          } else if (page == "calibrate") {
            //TODO: calculation is wrong
            const multiplier = calibrateWeight / (average - offset)
            setMultiplier(multiplier)
          }
          setState(`${page}Completed`)
        }
      }
    }
  }, [weight])

  const onTarePress = () => {
    if (pairedPeripheral) {
      setState("sampling")
      setReadings([])
      setOffset(0)
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel, 10])
    }
  }
  
  const onCalibratePress = () => {
    if (pairedPeripheral) {
      setState("sampling")
      setReadings([])
      setConsecutiveDeviationErrors(0)
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel, 10])
    }
  }

  useEffect(() => {
    if (state == "sampling") {
      const timer = setTimeout(() => {
        if (state == "sampling") {
          //still sampling after time out
          setState("timeout")
        }
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const onNextPress = () => {
    setPage("calibrate")
    setState("calibrateIdle")
  }

  const onFinishPress = () => {
  }

  return (<>
    <ScreenHeader title={t("wizard.calibrate.weight.screenTitle")} back />

    <ScrollView style={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t(`wizard.calibrate.weight.page.${page}`)}</Text>
      </View>

      <View style={styles.spacer} />
      
      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t(`wizard.calibrate.weight.state.${state}`)}</Text>
      </View>

      <View style={styles.spacerDouble} />

      { state == "tareIdle" && <>
        <TouchableOpacity style={styles.button} onPress={onTarePress}>
          <Text style={styles.text}>{t("wizard.calibrate.weight.tareButton")}</Text>
        </TouchableOpacity>
      </>}

      { state == "timeout" && page == "tare" && <>
        <TouchableOpacity style={styles.button} onPress={onTarePress}>
          <Text style={styles.text}>{t("wizard.calibrate.weight.retryButton")}</Text>
        </TouchableOpacity>
      </>}

      { state == "timeout" && page == "calibrate" && <>
        <TouchableOpacity style={styles.button} onPress={onCalibratePress}>
          <Text style={styles.text}>{t("wizard.calibrate.weight.retryButton")}</Text>
        </TouchableOpacity>
      </>}

      { state == "calibrateIdle" && <>
        <TextInput
          style={styles.input}
          onChangeText={(value) => setCalibrateWeight(parseFloat(value))}
          value={calibrateWeight.toString()}
          keyboardType={"numeric"}
          returnKeyType="next"
        />
        <View style={styles.spacer} />

        { calibrateWeight > 0 &&
          <TouchableOpacity style={styles.button} onPress={onCalibratePress}>
            <Text style={styles.text}>{t("wizard.calibrate.weight.calibrateButton")}</Text>
          </TouchableOpacity>
        }
      </>}

      <View style={styles.spacerDouble} />

      {/* Debug */}
      <Text style={styles.label}>State:</Text>
      <Text style={styles.text}>{state}</Text>

      <View style={styles.spacerDouble} />

      { !!readings.length && <Text style={styles.label}>Readings:</Text>}
      { readings.map((reading: number, index: number) => <Text key={index} style={styles.text}>{reading}</Text>)}

      <View style={styles.spacerDouble} />
     
      <Text style={styles.label}>Offset:</Text>
      <Text style={styles.text}>{offset}</Text>

      <View style={styles.spacerDouble} />
     
      <Text style={styles.label}>Multiplier:</Text>
      <Text style={styles.text}>{multiplier}</Text>
      
    </ScrollView>

    <View style={styles.itemContainer}>
      { state == "tareCompleted" &&
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      }

      { state == "calibrateCompleted" &&
        <TouchableOpacity style={styles.button} onPress={onFinishPress}>
          <Text style={styles.text}>{t("common.btnFinish")}</Text>
        </TouchableOpacity>
      }
    </View>
  </>)
}

export default CalibrateWeightScreen