import React, { FunctionComponent, useEffect, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import styles from './styles';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';

// Data
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { TiltModel } from '@/App/Models/TiltModel';
import { getPairedPeripheral, getTilt } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import { Colors } from '@/App/Theme';
import { Switch, Text, View } from 'react-native';

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
          <Switch
            // text={{ on: t("sensor.tilt.enabled"), off: t("sensor.tilt.disabled"), activeTextColor: Colors.black, inactiveTextColor: Colors.black }}
            trackColor={{ false: Colors.lightGrey, true: Colors.lightGrey }}
            thumbColor={Colors.yellow}
            value={value}
            onValueChange={setValue}
          />
          // <ToggleSwitch
          //   text={{ on: t("sensor.tilt.enabled"), off: t("sensor.tilt.disabled"), activeTextColor: Colors.black, inactiveTextColor: Colors.black }}
          //   textStyle={{ ...Fonts.style.regular }}
          //   textProps={{ allowFontScaling: false }}
          //   color={{ indicator: Colors.yellow, inactiveIndicator: Colors.grey, active: Colors.white, inactive: Colors.white, activeBorder: Colors.lightGrey, inactiveBorder: Colors.lightGrey }}
          //   padding={16}
          //   width={90}
          //   radius={Metrics.inputHeight / 4}
          //   active={value}
          //   onValueChange={setValue}
          // />
        }
      </View>

      <View style={styles.spacer} />

      <Text style={styles.instructions}>{t("sensor.tilt.instructions")}</Text>

      <View style={[styles.spacer, { flex: 1 }]} />
    </View>
  </>)
}

export default TiltScreen