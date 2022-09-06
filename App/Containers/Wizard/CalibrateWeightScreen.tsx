import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { ApplicationStyles, Fonts } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import useInterval from '../../Helpers/useInterval';
import useTimeout from '../../Helpers/useTimeout';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getWeightSensorDefinitions, getWeight } from 'App/Stores/BeepBase/Selectors';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel';
import { CHANNELS, WeightModel } from '../../Models/WeightModel';

// Components
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import TextInputMask from 'react-native-text-input-mask';
import Modal from 'react-native-modal';

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
  const isFocused = useIsFocused();
  const [isModalVisible, setModalVisible] = useState(false)
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const weight: WeightModel = useTypedSelector<WeightModel>(getWeight)
  const channel = CHANNELS.find(ch => ch.name == "A_GAIN128")?.bitmask
  const weightSensorDefinitions: Array<SensorDefinitionModel> = useTypedSelector<Array<SensorDefinitionModel>>(getWeightSensorDefinitions)
  const [page, setPage] = useState<PAGE>("tare")
  const [state, setState] = useState<STATE>("tareIdle")
  const [resetTimer, setResetTimer] = useState(false)
  const [readings, setReadings] = useState<Array<number>>([])
  const [offset, setOffset] = useState(0)

  const [calibrateWeight, setCalibrateWeight] = useState("")
  const [calibrateWeightFormatted, setCalibrateWeightFormatted] = useState("")
  const parsedCalibrateWeight = parseFloat(calibrateWeight)
  const [calibrateWeightError, setCalibrateWeightError] = useState("")
  
  const [consecutiveDeviationErrors, setConsecutiveDeviationErrors] = useState(0)
  const [multiplier, setMultiplier] = useState(0)

  const REQUIRED_CONSECUTIVE_READINGS = 3
  const TARE_ALLOWED_PERCENTUAL_DEVIATION = 0.3
  const CALIBRATE_ALLOWED_PERCENTUAL_DEVIATION = 1.0
  const ALLOWED_CONSECUTIVE_DEVIATION_ERRORS = 3
  const TIMEOUT = 60000

  const refresh = () => {
    if (pairedPeripheral) {
      //read weight sensor
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_HX711_CONVERSION)
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel, 10])
    }
  }

  useInterval(() => {
    refresh()
  }, isFocused ? (__DEV__ ? 5000 : 5000) : null)

  useEffect(() => {
    if (state == "sampling" && weight) {
      const newReading = weight.channels[0]?.value
      if (newReading) {
        //discard same readings. Each reading should be unique, within tolerance
        if (page == "calibrate" && readings.find(reading => reading == newReading) != undefined) {
          console.log("Discarding reading", newReading)
          return
        }

        const newReadings = [...readings, newReading]
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
              setReadings([])
              //reset timer for new set of REQUIRED_CONSECUTIVE_READINGS readings
              setResetTimer(true)
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
              if (!isNaN(parsedCalibrateWeight)) {
                const multiplier = parsedCalibrateWeight / (average - offset)
                setMultiplier(multiplier)
              }
            }
            setState(`${page}Completed`)
            setResetTimer(false)
          }
        }
      }
    }
  }, [weight])

  const onTarePress = () => {
    if (pairedPeripheral) {
      const weightSensorDefinition = weightSensorDefinitions[0]
      if (weightSensorDefinition?.offset > 0 && weightSensorDefinition?.multiplier > 0) {
        setModalVisible(true)
      } else {
        startTare()
      }
    }
  }
  
  const hideModal = () => {
    setModalVisible(false)
  }

  const startTare = () => {
    setState("sampling")
    setReadings([])
    setOffset(0)
    BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel, 10])
  }

  const onRecalibrateConfirmPress = () => {
    setModalVisible(false)
    startTare()
  }

  const onCalibratePress = () => {
    if (pairedPeripheral) {
      setState("sampling")
      setReadings([])
      setConsecutiveDeviationErrors(0)
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel, 10])
    }
  }

  useTimeout(() => {
    setState("timeout")
    setResetTimer(false)
  }, state == "sampling" || resetTimer ? TIMEOUT : null)

  const onCalibrateWeightChangeText = (formatted: string, extracted?: string | undefined) => {
    setCalibrateWeight(extracted || "")
    setCalibrateWeightFormatted(formatted)
  }

  const onCalibrateWeightValidate = () => {
    const parsed = parseFloat(calibrateWeight)
    if (isNaN(parsed)) {
      setCalibrateWeightError(t("wizard.calibrate.weight.calibrateWeightError"))
    }
    else {
      setCalibrateWeightError("")
    }
  }

  const onNextPress = () => {
    setPage("calibrate")
    setState("calibrateIdle")
  }

  const onFinishPress = () => {
    //update api sensor definition
    const weightSensorDefinition = weightSensorDefinitions[0]
    if (weightSensorDefinition) {
      const param = {
        ...weightSensorDefinition,
        offset,
        multiplier,
      }
      dispatch(ApiActions.updateApiSensorDefinition(param))
    }

    //close screen
    navigation.goBack()
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
        <TextInputMask
          style={styles.input}
          onBlur={onCalibrateWeightValidate}
          onChangeText={onCalibrateWeightChangeText}
          value={calibrateWeightFormatted}
          mask={"[0999]{.}[999]"}
          placeholder={t("wizard.calibrate.weight.calibrateWeightPlaceholder")}
          keyboardType={"numeric"}
          autoCapitalize={"characters"}
          autoCompleteType={"off"}
          autoCorrect={false}
          returnKeyType={"next"}
        />
        { !!calibrateWeightError && <>
          <View style={styles.spacerHalf} />
          <Text style={styles.error}>{calibrateWeightError}</Text>
        </>}

        <View style={styles.spacer} />

        { !isNaN(parsedCalibrateWeight) && parsedCalibrateWeight > 0 &&
          <TouchableOpacity style={styles.button} onPress={onCalibratePress}>
            <Text style={styles.text}>{t("wizard.calibrate.weight.calibrateButton")}</Text>
          </TouchableOpacity>
        }
      </>}

      <View style={styles.spacerDouble} />

      {/* Debug */}
      {/* <Text style={styles.label}>State:</Text>
      <Text style={styles.text}>{state}</Text>

      <View style={styles.spacerDouble} />

      { !!readings.length && <Text style={styles.label}>Readings:</Text>}
      { readings.map((reading: number, index: number) => <Text key={index} style={styles.text}>{reading}</Text>)}

      <View style={styles.spacerDouble} />
     
      <Text style={styles.label}>Offset:</Text>
      <Text style={styles.text}>{offset}</Text>

      <View style={styles.spacerDouble} />
     
      <Text style={styles.label}>Multiplier:</Text>
      <Text style={styles.text}>{multiplier}</Text> */}
      
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

    <Modal
      isVisible={isModalVisible}
      onBackdropPress={hideModal}
      onBackButtonPress={hideModal}
      useNativeDriver={true}
      backdropOpacity={0.3}
    >
      <View style={ApplicationStyles.modalContainer}>
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{t("wizard.calibrate.weight.confirmTitle")}</Text>
        <View style={styles.spacer} />
        <View style={styles.itemContianer}>
          <Text style={styles.itemText}>{t("wizard.calibrate.weight.confirmMessage")}</Text>
          <View style={styles.spacerDouble} />
          <View style={ApplicationStyles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, { width: "40%" }]} onPress={onRecalibrateConfirmPress}>
              <Text style={styles.text}>{t("wizard.calibrate.weight.confirmOkButton")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { width: "40%" }]} onPress={hideModal}>
              <Text style={styles.text}>{t("common.btnCancel")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.spacerHalf} />
        </View>
      </View>
    </Modal>

  </>)
}

export default CalibrateWeightScreen