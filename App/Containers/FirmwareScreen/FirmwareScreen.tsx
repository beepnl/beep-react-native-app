import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';
import { useNavigation } from '@react-navigation/native';
import { useInterval } from '../../Helpers/useInterval';

// Styles
import styles from './FirmwareScreenStyle'
import { Colors, Metrics } from '../../Theme';

// Utils
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import { NordicDFU, DFUEmitter } from "react-native-nordic-dfu";
import RNFS from 'react-native-fs'

// Data
import ApiActions from 'App/Stores/Api/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getFirmwaresStable } from 'App/Stores/Api/Selectors'
import { getFirmwaresTest } from 'App/Stores/Api/Selectors'
import { getFirmwareVersion } from 'App/Stores/BeepBase/Selectors'
import { FirmwareVersionModel } from '../../Models/FirmwareVersionModel';
import { FirmwareModel } from '../../Models/FirmwareModel';

// Components
import { Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScrollView } from 'react-native-gesture-handler';

interface Props {
}

const FirmwareScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const firmwareVersion: FirmwareVersionModel = useTypedSelector<FirmwareVersionModel>(getFirmwareVersion)
  const currentVersion = firmwareVersion?.toString()
  const firmwaresStable: Array<FirmwareModel> = useTypedSelector<Array<FirmwareModel>>(getFirmwaresStable)
  const firmwaresTest: Array<FirmwareModel> = useTypedSelector<Array<FirmwareModel>>(getFirmwaresTest)
  const latestStableVersion = firmwaresStable.length > 0 ? firmwaresStable[0].version : currentVersion

  useEffect(() => {
    //retrieve available firmwares from api
    dispatch(ApiActions.getFirmwares())

    //retrieve current firmware from peripheral
    BleHelpers.write(peripheral.id, COMMANDS.READ_FIRMWARE_VERSION)
    // BleHelpers.write(peripheral.id, COMMANDS.READ_HARDWARE_VERSION)
  }, []);

  const renderFirmwareItem = (firmware: FirmwareModel, key: number) => {
    return (
      <TouchableOpacity key={key} style={styles.navigationButton} onPress={() => { navigation.navigate("FirmwareDetailScreen", { firmware }) }}>
        <View>
          <Text style={styles.text}>{`BEEP base ${firmware.version}`}</Text>
          <Text style={styles.instructions}>{firmware.size}</Text>
        </View>
        <Icon name="chevron-right" size={30} color={Colors.lightGrey} />
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.mainContainer}>
      <ScreenHeader title={t("firmware.screenTitle")} back />

      <ScrollView style={styles.container} >
        <View style={styles.spacer} />

        <Text style={styles.label}>{t("firmware.current")}</Text>
        <View style={styles.spacer} />
        { renderFirmwareItem({ 
            version: currentVersion, 
            size: currentVersion == latestStableVersion ? t("firmware.latestInstalledDescription") : t("firmware.newerAvailableDescription")
          }
        )}
        <View style={styles.spacerDouble} />
        <Text style={styles.label}>{t("firmware.other")}</Text>
        <View style={styles.spacer} />
        { firmwaresStable.map((firmware: FirmwareModel, index: number) => renderFirmwareItem(firmware, index)) }
        <View style={styles.spacerDouble} />
        <Text style={styles.label}>{t("firmware.test")}</Text>
        <View style={styles.spacer} />
        { firmwaresTest.map((firmware: FirmwareModel, index: number) => renderFirmwareItem(firmware, index)) }

      </ScrollView>
    </View>
  )
}

export default FirmwareScreen