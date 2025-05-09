import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

// Styles
import styles from './styles'
import { Colors, Fonts, Images, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';

// Data

// Components
import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  navigation: StackNavigationProp,
}

const WizardAssembleScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onNextPress = () => {
    navigation.navigate("WizardWakeUpScreen")
  }

  return (<>
    <ScreenHeader title={t("wizard.assemble.screenTitle")} back />

    <ScrollView style={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.assemble.step1")}</Text>
      </View>
      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.assemble.step2")}</Text>
      </View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Image style={{ width: Metrics.clientWidth - Metrics.doubleBaseMargin, aspectRatio: 3840/2160, height: null, margin: Metrics.baseMargin }} source={Images.beepBase} resizeMode="contain" />
      </View>
      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.assemble.nb")}</Text>
      </View>

    </ScrollView>
    
    <SafeAreaView style={{ backgroundColor: Colors.transparent }} edges={["bottom"]}>
      <View style={styles.itemContainer}>
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </>)
}

export default WizardAssembleScreen