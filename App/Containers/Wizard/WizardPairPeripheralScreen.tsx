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

// Data
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'

// Components
import { ScrollView, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import Logo from 'App/Assets/Images/ArmonLogo'
import Button from '../../Components/Button';
import BleScreen from '../BleScreen/BleScreen'
import ScreenHeader from '../../Components/ScreenHeader';
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';

interface Props {
  navigation: StackNavigationProp,
}

const WizardPairPeripheralScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  // const navigation = useNavigation();

  const onNextPress = () => {
    navigation.navigate("WizardPairedScreen")
  }

  return (
    <SafeAreaView style={styles.mainContainer}>

      <ScreenHeader title={t("wizard.screenTitle")} back />

      <View style={styles.spacerDouble} />

      <View style={styles.container}>

        <View style={styles.itemContainer}>
          <Text style={styles.itemText}>{t("wizard.pair.description")}</Text>
        </View>

        <View style={styles.spacer} />

        {/* <BleScreen showScreenHeader={false} onPaired={() => { navigation.navigate("WizardPairedScreen") }} /> */}
        <BleScreen showScreenHeader={false} />

        <View style={styles.spacer} />

        { !!peripheral && 
          <TouchableOpacity onPress={onNextPress}>
            <Text style={[styles.textButton, { alignSelf: "flex-end" }]}>{t("common.btnNext")}</Text>
          </TouchableOpacity>
        }
      </View>

    </SafeAreaView>
  )
}

export default WizardPairPeripheralScreen