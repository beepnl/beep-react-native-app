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
import { useInterval } from '../../Helpers/useInterval';

// Data
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { TemperatureModel } from '../../Models/TemperatureModel';
import { getTemperatures } from 'App/Stores/BeepBase/Selectors';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'

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
  const temperatures: Array<TemperatureModel> = useTypedSelector<Array<TemperatureModel>>(getTemperatures)
  const [value, setValue] = useState("Sensor 1")

  const refresh = () => {
    if (pairedPeripheral) {
      //initialize temperature sensors
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_DS18B20_CONVERSION, 0xFF])
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
  }, 1000)

  const onFinishPress = () => {
    navigation.goBack()
  }

  const onToggleSwitchChange = (temperatureModel: TemperatureModel, value: boolean) => {
    // dispatch(SettingsActions.updateFunction(
    //   {
    //     ...func,
    //     enabled: value,
    //   }
    // ))
  }


  return (<>
    <ScreenHeader title={t("wizard.calibrate.temperature.screenTitle")} back />

    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.calibrate.temperature.step1")}</Text>
        <View style={styles.spacer} />
        <Text style={styles.text}>{t("wizard.calibrate.temperature.step2")}</Text>
        <View style={styles.spacer} />
        <Text style={styles.text}>{t("wizard.calibrate.temperature.step3")}</Text>
      </View>

      <View style={styles.spacerDouble} />

      { temperatures.map((temperatureModel: TemperatureModel, index: number) => <View>
        <View key={index} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
          <IconFontAwesome name="thermometer-2" size={40} color={Colors.black} />
          <Text style={styles.textBig}>{temperatureModel.toString()}</Text>
        </View>
        <View style={styles.spacer} />
        <TextInput
          // ref={inputUsernameRef}
          style={styles.input}
          onChangeText={setValue}
          value={value}
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
            color={{ indicator: Colors.yellow, inactiveIndicator: Colors.black, active: Colors.white, inactive: Colors.white, activeBorder: Colors.lightGrey, inactiveBorder: Colors.lightGrey }}
            padding={16}
            width={115}
            radius={Metrics.inputHeight / 4}
            onValueChange={(value: boolean) => onToggleSwitchChange(temperatureModel, value)}
          />
        </View>
      </View>)}

      <View style={[styles.spacer, { flex: 1 }]} />

      <TouchableOpacity style={styles.button} onPress={onFinishPress}>
        <Text style={styles.text}>{t("common.btnFinish")}</Text>
      </TouchableOpacity>
    </ScrollView>
  </>)
}

export default CalibrateTemperatureScreen