import React, { FunctionComponent, useEffect } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { Colors } from '../../Theme';
import styles from './FirmwareScreenStyle';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';

// Data
import { FirmwareModel } from '@/App/Models/FirmwareModel';
import { FirmwareVersionModel } from '@/App/Models/FirmwareVersionModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import ApiActions from '@/App/Stores/Api/Actions';
import { getFirmwaresStable, getFirmwaresTest } from '@/App/Stores/Api/Selectors';
import { getFirmwareVersion, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import NavigationButton from '@/App/Components/NavigationButton';
import ScreenHeader from '@/App/Components/ScreenHeader';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

  return (
    <View style={styles.mainContainer}>
      <ScreenHeader title={t("firmware.screenTitle")} back />

      <ScrollView style={styles.container} >
        <View style={styles.spacer} />

        <Text style={styles.label}>{t("firmware.current")}</Text>
        <View style={styles.spacer} />
        <NavigationButton 
          title={currentVersion ? `BEEP base ${currentVersion}` : "BEEP base"} 
          subTitle={currentVersion == latestStableVersion ? t("firmware.latestInstalledDescription") : t("firmware.newerAvailableDescription")} 
          Icon={<IconMaterialCommunityIcons name="hexagon-outline" size={34} color={Colors.yellow} />}
          disabled={true} 
        />
        <View style={styles.spacerDouble} />
        <Text style={styles.label}>{t("firmware.other")}</Text>
        <View style={styles.spacer} />
        { firmwaresStable.map((firmware: FirmwareModel, index: number) => 
          <NavigationButton 
            key={`stable${index}`}
            title={`BEEP base ${firmware.version}`} 
            subTitle={firmware.size} 
            Icon={<IconMaterialCommunityIcons name="hexagon-outline" size={34} color={Colors.yellow} />}
            onPress={() => navigation.navigate("FirmwareDetailScreen", { firmware })} 
          />
        )}
        <View style={styles.spacerDouble} />
        <Text style={styles.label}>{t("firmware.test")}</Text>
        <View style={styles.spacer} />
        { firmwaresTest.map((firmware: FirmwareModel, index: number) => 
          <NavigationButton 
            key={`test${index}`}
            title={`BEEP base ${firmware.version}`} 
            subTitle={firmware.size} 
            Icon={<IconMaterialCommunityIcons name="hexagon-outline" size={34} color={Colors.yellow} />}
            onPress={() => navigation.navigate("FirmwareDetailScreen", { firmware })} 
          /> 
        )}
        <View style={styles.spacerDouble} />

      </ScrollView>
    </View>
  )
}

export default FirmwareScreen