import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import { TiltModel } from '../../Models/TiltModel';
import { getTilt } from '../../Stores/BeepBase/Selectors';

// Components
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import ToggleSwitch from 'rn-toggle-switch';

interface Props {
  navigation: StackNavigationProp,
}

const TiltScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const tiltSensor = useTypedSelector<TiltModel>(getTilt)
  const [value, _setValue] = useState(true)
  
  const setValue = (value: boolean) => {
    //update UI
    _setValue(value)

    //update device
    BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_SQ_MIN_STATE, value ? 0 : 1)
  }

  useEffect(() => {
    if (pairedPeripheral) {
      //read tilt sensor
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_SQ_MIN_STATE)
    }
  }, [])
 
  useEffect(() => {
    _setValue(tiltSensor?.isSensorEnabled())
  }, [tiltSensor])
 
  return (<>
    <ScreenHeader title={t("sensor.tilt.screenTitle")} back />

    <View style={styles.container}>
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("sensor.settings")}</Text>

      <View style={styles.spacer} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={styles.label}>{t("sensor.tilt.tiltSensor")}</Text>
        { tiltSensor?.isSensorEnabled() != undefined &&
          <ToggleSwitch
            text={{ on: t("sensor.tilt.enabled"), off: t("sensor.tilt.disabled"), activeTextColor: Colors.black, inactiveTextColor: Colors.black }}
            textStyle={{ ...Fonts.style.regular }}
            textProps={{ allowFontScaling: false }}
            color={{ indicator: Colors.yellow, inactiveIndicator: Colors.grey, active: Colors.white, inactive: Colors.white, activeBorder: Colors.lightGrey, inactiveBorder: Colors.lightGrey }}
            padding={16}
            width={90}
            radius={Metrics.inputHeight / 4}
            active={value}
            onValueChange={setValue}
          />
        }
      </View>

      <View style={styles.spacer} />

      <Text style={styles.instructions}>{t("sensor.tilt.instructions")}</Text>

      <View style={[styles.spacer, { flex: 1 }]} />
    </View>
  </>)
}

export default TiltScreen