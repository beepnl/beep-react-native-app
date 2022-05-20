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
import { useInterval } from '../../Helpers/useInterval';

// Data
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripherals } from '../../Stores/Settings/Selectors';
import { TemperatureModel } from '../../Models/TemperatureModel';
import { getTemperatures } from 'App/Stores/BeepBase/Selectors';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'

// Components
import { ScrollView, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';

interface Props {
  navigation: StackNavigationProp,
}

const WizardPairedPeripheralScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  // const navigation = useNavigation();
  // const pairedPeripherals: Array<PairedPeripheralModel> = useTypedSelector<Array<PairedPeripheralModel>>(getPairedPeripherals)
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const temperatures: Array<TemperatureModel> = useTypedSelector<Array<TemperatureModel>>(getTemperatures)

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

  const onNextPress = () => {
    navigation.navigate("HomeScreen")
  }

  return (
    <SafeAreaView style={styles.mainContainer}>

      <ScreenHeader title={t("wizard.screenTitle")} />

      <View style={styles.container}>
        <View style={styles.spacer} />

        <View style={styles.itemContainer}>
          <Text style={styles.itemText}>{t("wizard.paired.description")}</Text>
        </View>

        <View style={styles.spacer} />

        <Text style={styles.text}>{ `Temperature sensor count: ${temperatures.length}` }</Text>

        { temperatures.map((temperatureModel, index) => <View key={index} style={{ flexDirection: "row" }}>
            <Text style={styles.text}>{ `Sensor ${index + 1}: ${temperatureModel.toString()}` }</Text>
          </View>
        )}

        <View style={styles.spacer} />

        <TouchableOpacity onPress={onNextPress}>
          <Text style={[styles.textButton, { alignSelf: "flex-end" }]}>{t("common.btnFinish")}</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

export default WizardPairedPeripheralScreen