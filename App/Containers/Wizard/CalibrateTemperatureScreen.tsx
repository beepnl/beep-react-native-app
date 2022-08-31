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

// Components
import { ScrollView, Text, View, TouchableOpacity, Image, TextInput } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import ToggleSwitch from 'rn-toggle-switch';

interface Props {
  navigation: StackNavigationProp,
}

const CalibrateTemperatureScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const temperatureSensors: Array<TemperatureModel> = useTypedSelector<Array<TemperatureModel>>(getTemperatures)
  const temperatureSensorDefinitions: Array<SensorDefinitionModel> = useTypedSelector<Array<SensorDefinitionModel>>((state: any) => getTemperatureSensorDefinitions(state, temperatureSensors.length))
  const names = temperatureSensors.map((temperatureModel: TemperatureModel, index: number) => {
    const sensorAbbr = `t_${index}`
    const sensorDefinition = temperatureSensorDefinitions.find(temperatureSensorDefinition => temperatureSensorDefinition.inputAbbreviation === sensorAbbr)
    const [value, setValue] = useState(sensorDefinition?.name || `Temperature sensor ${index + 1}`)
    return { value, setValue }
  })
  const sensorLocations = temperatureSensors.map((temperatureModel: TemperatureModel, index: number) => {
    const sensorAbbr = `t_${index}`
    const sensorDefinition = temperatureSensorDefinitions.find(temperatureSensorDefinition => temperatureSensorDefinition.inputAbbreviation === sensorAbbr)
    const [value, setValue] = useState(sensorDefinition?.isInside ?? true)
    return { value, setValue }
  })

  const refresh = () => {
    if (pairedPeripheral) {
      //read temperature sensors
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_DS18B20_CONVERSION, 0xFF])
    }
  }

  useEffect(() => {
    //this screen is an edit screen for the temperature sensors so we
    //need to overwrite sensor definition props with values from api
    if (temperatureSensors.length === temperatureSensorDefinitions.length) {
      temperatureSensorDefinitions.forEach((sensorDefinition: SensorDefinitionModel, index: number) => {
        names[index].setValue(sensorDefinition.name)
        sensorLocations[index].setValue(!!sensorDefinition.isInside)
      })
    } else {
      //illegal state, device sensor count differs from api sensor count
      navigation.goBack()
    }

    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_DS18B20_CONVERSION)
    }

    refresh()
  }, [])

  useInterval(() => {
    refresh()
  }, __DEV__ ? 20000 : 2000)

  const onFinishPress = () => {
    temperatureSensors.forEach((temperatureModel: TemperatureModel, index: number) => {
      const name = names[index].value
      const isInside = sensorLocations[index].value
      const temperatureSensorDefinition = temperatureSensorDefinitions[index]
      const param = {
        ...temperatureSensorDefinition,
        name,
        isInside,
      }
      dispatch(ApiActions.updateApiSensorDefinition(param))
    })

    //close screen
    navigation.goBack()
  }

  return (<>
    <ScreenHeader title={t("wizard.calibrate.temperature.screenTitle")} back />

    <ScrollView style={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.calibrate.temperature.step1")}</Text>
        <View style={styles.spacer} />
        <Text style={styles.text}>{t("wizard.calibrate.temperature.step2")}</Text>
        <View style={styles.spacer} />
        <Text style={styles.text}>{t("wizard.calibrate.temperature.step3")}</Text>
      </View>

      <View style={styles.spacerDouble} />

      { temperatureSensors.map((temperatureModel: TemperatureModel, index: number) => <View key={index}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
          <IconFontAwesome name="thermometer-2" size={40} color={Colors.black} />
          <Text style={styles.textBig}>{temperatureModel.toString()}</Text>
        </View>
        <View style={styles.spacer} />
        <TextInput
          style={styles.input}
          onChangeText={names[index].setValue}
          value={names[index].value}
          maxLength={100}
          returnKeyType="next"
          // blurOnSubmit={false}
          // onSubmitEditing={() => inputPasswordRef?.current?.focus()}
        />
        <View style={styles.spacer} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={styles.label}>{t("wizard.calibrate.temperature.location")}</Text>
          <ToggleSwitch
            text={{ on: t("wizard.calibrate.temperature.inside"), off: t("wizard.calibrate.temperature.outside"), activeTextColor: Colors.black, inactiveTextColor: Colors.black }}
            textStyle={{ ...Fonts.style.regular }}
            textProps={{ allowFontScaling: false }}
            color={{ indicator: Colors.yellow, inactiveIndicator: Colors.grey, active: Colors.white, inactive: Colors.white, activeBorder: Colors.lightGrey, inactiveBorder: Colors.lightGrey }}
            padding={16}
            width={115}
            radius={Metrics.inputHeight / 4}
            active={sensorLocations[index].value}
            onValueChange={sensorLocations[index].setValue}
            />
        </View>
        <View style={styles.spacerDouble} />
      </View>)}

    </ScrollView>

    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.button} onPress={onFinishPress}>
        <Text style={styles.text}>{t("common.btnFinish")}</Text>
      </TouchableOpacity>
    </View>
  </>)
}

export default CalibrateTemperatureScreen