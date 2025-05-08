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
import OpenExternalHelpers from '../../Helpers/OpenExternalHelpers';
import { tidy, arrange, desc } from '@tidyjs/tidy';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import GlobalActions from 'App/Stores/Global/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getDevices } from 'App/Stores/User/Selectors'
import { getAppMode } from 'App/Stores/Global/Selectors'
import { DeviceModel } from '../../Models/DeviceModel';

// Components
import { Text, View, TouchableOpacity, Button, ScrollView, RefreshControl, Image } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import NavigationButton from '../../Components/NavigationButton';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AppMode } from 'App/Stores/Global/InitialState';

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
  const appMode: AppMode = useTypedSelector<AppMode>(getAppMode)
  const [isRefreshing, setRefreshing] = useState(false)

  const [isScreenMounted, setScreenIsMounted] = useState(false);

  useEffect(() => {
    setScreenIsMounted(true);
  }, []);

  useEffect(() => {
    if (isScreenMounted && appMode.mode === "app") {
      const { screen, params } = appMode.params
      console.log("screen", screen)
      console.log("params", params)
      if (screen) {
        navigation.navigate(screen as never, params as never)
      }
    }
  }, [isScreenMounted, appMode, navigation])

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
    navigation.navigate("PeripheralDetailScreen", { device })
  }

  const onHelpPress = () => {
    OpenExternalHelpers.openUrl("https://beepsupport.freshdesk.com/en/support/solutions/folders/60000479696")
  }

  const onBackPress = () => {
    if (!navigation.canGoBack() && appMode.mode == "app") {
      dispatch(GlobalActions.setAppMode({ mode: "web" }))
    }
  }

  return (<>
    <ScreenHeader title={t("home.screenTitle")} menu back onBackPress={onBackPress} />

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