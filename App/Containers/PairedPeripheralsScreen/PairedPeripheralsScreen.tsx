import React, { FunctionComponent, useEffect, useState } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from 'react-navigation-hooks';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './PairedPeripheralsScreenStyle'
import { Colors, Fonts, Metrics } from '../../Theme';

// Utils
import BleHelpers from '../../Helpers/BleHelpers';

// Redux
import { getPairedPeripherals } from 'App/Stores/Settings/Selectors'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';

// Components
import { Text, View } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TouchableHighlight } from "react-native";
import Button from '../../Components/Button';
import Images from '../../Assets/Images';
import BluetoothLogo from '../../Assets/Images/BluetoothLogo';

interface Props {
}

const PairedPeripheralsScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const pairedPeripherals: Array<PairedPeripheralModel> = useTypedSelector<Array<PairedPeripheralModel>>(getPairedPeripherals)

  //auto connect paired peripherals when screen is opened
  useEffect(() => {
    if (pairedPeripherals && pairedPeripherals.length > 0) {
      pairedPeripherals.forEach(p => {
        if (!p.isConnected) {
          BleHelpers.connectPeripheral(p.id)
        }
      })
    }
  }, [])
  
  const onBluetoothPress = (peripheral: PairedPeripheralModel) => {
    if (!peripheral.isConnected) {
      BleHelpers.connectPeripheral(peripheral.id)
    }
  }

  const onAddPress = () => {
    navigation.navigate("BleScreen")
  }

  const renderItem = (peripheral: PairedPeripheralModel) => {
    return (
      <View key={peripheral.id} style={styles.itemContainer}>
        { (pairedPeripherals.length > 1) && (peripheral.orientation == "left" || peripheral.orientation == "right") &&
          <Button 
            style={styles.itemButton}
            size="small" 
            shadow={false} 
            image={Images.getIconByName(peripheral.orientation == "left" ? "arrowLeft" : "arrowRight")} 
            disabled 
          />
        }
        
        { peripheral.orientation == "none" && <View style={styles.itemButton} />}

        <Text style={{fontSize: 18, textAlign: 'left', color: Colors.text, marginLeft: Metrics.baseMargin, padding: 2}}>{peripheral.name}</Text>

        <View style={{ flexDirection: "row" }}>
          <View style={styles.spacer} />

          <TouchableHighlight onPress={() => onBluetoothPress(peripheral)} disabled={peripheral.isConnected} >
            <BluetoothLogo backgroundColor={peripheral.isConnected ? Colors.green : Colors.error} />
          </TouchableHighlight>

          <View style={styles.spacer} />

          <TouchableHighlight onPress={() => navigation.navigate("PeripheralDetailScreen", { peripheral }) }>
            <Icon name={"edit"} style={styles.iconEdit} size={40} />
          </TouchableHighlight>

          <View style={styles.spacer} />
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.mainContainer}>
      <ScreenHeader title={t("pairedPeripherals.screenTitle")} back />

      <View style={styles.spacer} />

      { pairedPeripherals.map((peripheral: PairedPeripheralModel) => renderItem(peripheral)) }

      <View style={styles.spacerDouble} />

      <Button 
        size="small" 
        shadow={false}
        title={t("pairedPeripherals.add")}
        onPress={onAddPress} 
      />

    </View>
  )
}

export default PairedPeripheralsScreen