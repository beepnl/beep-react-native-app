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
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { TemperatureModel } from '../../Models/TemperatureModel';
import { getTemperatures } from 'App/Stores/BeepBase/Selectors';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'

// Components
import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import NavigationButton from '../../Components/NavigationButton';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';

interface Props {
  navigation: StackNavigationProp,
}

const WizardCalibrateScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const temperatures: Array<TemperatureModel> = useTypedSelector<Array<TemperatureModel>>(getTemperatures)

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
    refresh()
  }, [])

  useInterval(() => {
    refresh()
  }, 5000)

  const initializeSensors = () => {

  }

  const onNextPress = () => {
    navigation.navigate("HomeScreen")
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