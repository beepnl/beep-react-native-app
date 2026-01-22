import React, { FunctionComponent } from 'react';

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { Fonts, Metrics } from '@/App/Theme';
import styles from './styles';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';

// Data

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import { Image } from 'expo-image';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  navigation: StackNavigationProp,
}

const WizardWakeUpScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onNextPress = () => {
    navigation.navigate("WizardPairPeripheralScreen")
  }

  return (<>
    <ScreenHeader title={t("wizard.wakeUp.screenTitle")} back />

    <ScrollView style={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={[styles.text, { ...Fonts.style.bold }]}>{t("wizard.wakeUp.buttonTitle")}</Text>
        <Text style={styles.text}>{t("wizard.wakeUp.button")}</Text>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Image style={{ width: "50%", aspectRatio: 444/444, height: null, margin: Metrics.baseMargin }} source={{ uri: "activate_button" }} contentFit="contain" />
      </View>

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <Text style={[styles.text, { ...Fonts.style.bold }]}>{t("wizard.wakeUp.magnetTitle")}</Text>
        <Text style={styles.text}>{t("wizard.wakeUp.magnet")}</Text>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Image style={{ width: "50%", aspectRatio: 444/444, height: null, margin: Metrics.baseMargin }} source={{ uri: "activate_magnet" }} contentFit="contain" />
      </View>

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <Text style={[styles.text, { ...Fonts.style.bold }]}>{t("wizard.wakeUp.allTitle")}</Text>
        <Text style={styles.text}>{t("wizard.wakeUp.all")}</Text>
      </View>

      <View style={styles.spacer} />

    </ScrollView>

    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.button} onPress={onNextPress}>
        <Text style={styles.text}>{t("common.btnNext")}</Text>
      </TouchableOpacity>
    </View>
  </>)
}

export default WizardWakeUpScreen