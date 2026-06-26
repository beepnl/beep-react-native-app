import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useIsFocused, NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { Colors } from '@/App/Theme';
import styles from './styles';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import useInterval from '@/App/Helpers/useInterval';

// Data
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { SensorDefinitionModel } from '@/App/Models/SensorDefinitionModel';
import { TemperatureModel } from '@/App/Models/TemperatureModel';
import ApiActions from '@/App/Stores/Api/Actions';
import { getPairedPeripheral, getTemperatureSensorDefinitions, getTemperatures } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import IconFontAwesome from '@expo/vector-icons/FontAwesome';
import ToggleSwitch from '@/App/Components/ToggleSwitch';

interface Props {
  navigation: NavigationProp<any>,
}

const CalibrateTemperatureScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const temperatureSensors: Array<TemperatureModel> = useTypedSelector<Array<TemperatureModel>>(getTemperatures)
  const temperatureSensorDefinitions: Array<SensorDefinitionModel> = useTypedSelector<Array<SensorDefinitionModel>>((state: any) => getTemperatureSensorDefinitions(state, temperatureSensors.length))
  const [namesState, setNamesState] = useState<string[]>([])
  const [locationsState, setLocationsState] = useState<boolean[]>([])
  const formInitializedRef = useRef(false)

  useEffect(() => {
    if (formInitializedRef.current || temperatureSensors.length === 0) {
      return
    }

    //this screen is an edit screen for the temperature sensors so we
    //need to overwrite sensor definition props with values from api
    if (temperatureSensors.length === temperatureSensorDefinitions.length) {
      const initialNames = temperatureSensorDefinitions.map(d => d.name)
      const initialLocations = temperatureSensorDefinitions.map(d => !!d.isInside)
      setNamesState(initialNames)
      setLocationsState(initialLocations)
      formInitializedRef.current = true
    } else {
      //illegal state, device sensor count differs from api sensor count
      navigation.goBack()
    }
  }, [navigation, temperatureSensors.length, temperatureSensorDefinitions])

  useEffect(() => {
    if (isFocused && pairedPeripheral?.id) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_DS18B20_STATE)
    }
  }, [isFocused, pairedPeripheral?.id])

  const refresh = () => {
    if (pairedPeripheral) {
      //read temperature sensors
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_DS18B20_STATE)
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_DS18B20_CONVERSION, 0xFF])
    }
  }

  useInterval(() => {
    refresh()
  }, isFocused ? (__DEV__ ? 20000 : 5000) : null)

  const onFinishPress = () => {
    temperatureSensors.forEach((temperatureModel: TemperatureModel, index: number) => {
      const name = namesState[index] || `Temperature sensor ${index + 1}`
      const isInside = locationsState[index] ?? true
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
          onChangeText={(text) => {
            const newNames = [...namesState]
            newNames[index] = text
            setNamesState(newNames)
          }}
          value={namesState[index] || ""}
          maxLength={100}
          returnKeyType="next"
          // blurOnSubmit={false}
          // onSubmitEditing={() => inputPasswordRef?.current?.focus()}
        />
        <View style={styles.spacer} />
        <Text style={styles.label}>{t("wizard.calibrate.temperature.location")}</Text>
        <ToggleSwitch
          value={locationsState[index] ?? true}
          onValueChange={(val) => {
            const newLocations = [...locationsState]
            newLocations[index] = val
            setLocationsState(newLocations)
          }}
          offLabel={t("wizard.calibrate.temperature.outside")}
          onLabel={t("wizard.calibrate.temperature.inside")}
          trackColor={{ false: Colors.lightGrey, true: Colors.lightGrey }}
          thumbColor={Colors.yellow}
        />
        <View style={styles.spacerDouble} />
        <View style={styles.spacer} />
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
