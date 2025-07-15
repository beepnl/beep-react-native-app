import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './HomeScreenStyle'
import { Colors, Images } from '../../Theme';

// Utils
import BleHelpers from '../../Helpers/BleHelpers';
import { BleLogger } from '../../Helpers/BleLogger';
import OpenExternalHelpers from '../../Helpers/OpenExternalHelpers';
import { tidy, arrange, desc } from '@tidyjs/tidy';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getDevices } from 'App/Stores/User/Selectors'
import { DeviceModel } from '../../Models/DeviceModel';

// Components
import { Text, View, TouchableOpacity, Button, ScrollView, RefreshControl, Image, Alert } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import NavigationButton from '../../Components/NavigationButton';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';

type ListItem = DeviceModel & { isConnected: boolean }

interface Props {
}

const HomeScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const devices: Array<DeviceModel> = useTypedSelector<Array<DeviceModel>>(getDevices)
  const [listItems, setListItems] = useState<Array<ListItem>>([])

  const [isRefreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setRefreshing(false)

    //sort devices for list
    const items = devices.map((device: DeviceModel) => ({ ...device, isConnected: pairedPeripheral?.deviceId === device.id }))
    const sortedItems = tidy(items, arrange([
      desc("isConnected"),                    //connected devices on top
      desc("owner")                           //devices from other groups at the bottom
    ]))
    setListItems(sortedItems)
  }, [devices, pairedPeripheral])

  const onRefresh = () => {
    setRefreshing(true)
    dispatch(ApiActions.getDevices())
  }

  const onStartWizardPress = () => {
    navigation.navigate("Wizard")
  }

  const onDevicePress = (device: DeviceModel) => {
    BleLogger.log(`[BLE] User selected device from HomeScreen: ${device.name} (${device.id})`)
    navigation.navigate("PeripheralDetailScreen", { device })
  }

  const onHelpPress = () => {
    OpenExternalHelpers.openUrl("https://beepsupport.freshdesk.com/en/support/solutions/folders/60000479696")
  }

  const onExportBleLogsPress = async () => {
    try {
      const logPath = await BleLogger.exportToDownloads()
      if (logPath) {
        Alert.alert(
          t("common.success"),
          `BLE logs exported to: ${logPath}`,
          [{ text: t("common.ok") }]
        )
      } else {
        Alert.alert(
          t("common.error"),
          "No BLE logs found to export",
          [{ text: t("common.ok") }]
        )
      }
    } catch (error) {
      Alert.alert(
        t("common.error"),
        `Failed to export logs: ${error}`,
        [{ text: t("common.ok") }]
      )
    }
  }

  return (<>
    <ScreenHeader title={t("home.screenTitle")} menu />

    <View style={styles.container}>
      <View style={styles.spacer} />
      <Text style={styles.text}>{t("home.introduction")}</Text>

      <View style={styles.spacerDouble} />
      
      <TouchableOpacity style={styles.button} onPress={onStartWizardPress}>
        <Text style={styles.text}>{t("home.startWizard")}</Text>
      </TouchableOpacity>

      <View style={styles.spacerDouble} />
      <View style={styles.separator} />
      <View style={styles.spacer} />

      <TouchableOpacity style={[styles.button, { backgroundColor: Colors.lighterGrey }]} onPress={onExportBleLogsPress}>
        <Text style={styles.text}>Export BLE Debug Logs</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <ScrollView style={styles.devicesContainer} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />} >
        { listItems.map((device: ListItem, index: number) => 
          <NavigationButton 
            key={index} 
            title={device.name} 
            Icon={device.isConnected ?
              <IconMaterialIcons name={"bluetooth"} size={30} color={Colors.bluetooth} /> :
              <Image style={{ width: 30, height: 30 }} source={Images.beepBase} resizeMode="cover" />
            }
            IconRight={!device.owner ? <IconMaterialIcons name={"group"} size={30} color={Colors.lighterGrey} /> : undefined }
            onPress={() => onDevicePress(device)} 
          />
        )}
      </ScrollView>

      <View style={styles.spacer} />
      <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }} onPress={onHelpPress}>
        <IconFontAwesome name="question-circle-o" size={22} color={Colors.link} />
        <View style={styles.spacerHalf} />
        <Text style={[styles.text, styles.link]}>{t("home.help")}</Text>
      </TouchableOpacity>
      <View style={styles.spacer} />
    </View>
  </>)
}

export default HomeScreen