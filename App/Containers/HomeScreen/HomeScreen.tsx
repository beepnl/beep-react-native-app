import React, { FunctionComponent, useEffect, useState, useCallback, useRef, useMemo } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './HomeScreenStyle'
import { Colors, Images } from '../../Theme';

import { RNLogger } from '../../Helpers/RNLogger';
import BleHelpers from '../../Helpers/BleHelpers';
import * as tidyJs from '@tidyjs/tidy';

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
  const sortedItems = useMemo(() => {
    const items = devices.map((device: DeviceModel) => ({ ...device, isConnected: pairedPeripheral?.deviceId === device.id }));
    return tidyJs.tidy(items, tidyJs.arrange([
      tidyJs.desc("isConnected"),                    //connected devices on top
      tidyJs.desc("owner")                           //devices from other groups at the bottom
    ]));
  }, [devices, pairedPeripheral]);

  const [listItems, setListItems] = useState<Array<ListItem>>(sortedItems);
  const [isRefreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setRefreshing(false);
    setListItems(sortedItems);
  }, [devices, pairedPeripheral, sortedItems]);

  const onListItemPress = (device: DeviceModel) => {
    RNLogger.log(`[RN] User selected device from HomeScreen: ${device.name} (${device.id})`)
    navigation.navigate('PeripheralDetailScreen', { device, connect: true })
  }

  const onExportLogsPress = async () => {
    try {
      const result = await BleHelpers.exportBleLogFile();
      if (result) {
        Alert.alert(t('common.success'), `Logs exported to: ${result}`,
          [{ text: t('common.ok') }])
      } else {
        Alert.alert(t('common.error'), 'No logs found to export',
          [{ text: t('common.ok') }])
      }
    } catch (error) {
      Alert.alert(t('common.error'), `Failed to export logs: ${error}`,
        [{ text: t('common.ok') }])
    }
  }

  return (
    <>
      <ScreenHeader title={t('home.screenTitle')} menu />
      <View style={styles.container}>
        <View style={styles.spacer} />
        <Text style={styles.text}>{t('home.introduction')}</Text>
        <View style={styles.spacerDouble} />
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Wizard')}>
          <Text style={styles.text}>{t('home.startWizard')}</Text>
        </TouchableOpacity>
        <View style={styles.spacerDouble} />
        <View style={styles.separator} />
        <View style={styles.spacer} />
        <TouchableOpacity style={[styles.button, { backgroundColor: Colors.lighterGrey }]} onPress={onExportLogsPress}>
          <Text style={styles.text}>Export Debug Logs</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
        <ScrollView 
          style={styles.devicesContainer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { 
            setRefreshing(true);
            dispatch(ApiActions.getDevices());
          }} />}
        >
          {listItems.map((item, i) => (
            <NavigationButton
              key={i}
              title={item.name}
              Icon={item.isConnected ? <IconFontAwesome name="bluetooth" size={30} color={Colors.bluetooth} /> : <Image style={{width: 30, height: 30}} source={Images.beepBase} resizeMode='cover'/>}
              IconRight={item.owner ? undefined : <IconFontAwesome name="group" size={30} color={Colors.lighterGrey} />}
              onPress={() => onListItemPress(item)}
            />
          ))}
        </ScrollView>
        <View style={styles.spacer} />
        <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}} onPress={() => OpenExternalHelpers.openUrl('https://beepsupport.freshdesk.com/en/support/solutions/folders/60000479696')}>
          <IconFontAwesome name="question-circle-o" size={22} color={Colors.link} />
          <View style={styles.spacerHalf} />
          <Text style={[styles.text, styles.link]}>{t('home.help')}</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
      </View>
    </>
  )
}

export default HomeScreen;