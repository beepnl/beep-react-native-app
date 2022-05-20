import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './LoginScreenStyle'
import { Images, Metrics } from '../../Theme';

// Utils

// Data

// Components
import { Text, View, TouchableOpacity, Button, TextInput, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

interface Props {
}

const LoginScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [userName, setUserName] = useState("")
  const [password, setPassword] = useState("")

  const inputUserNameRef = useRef<TextInput>(null)
  const inputPasswordRef = useRef<TextInput>(null)

  const onLoginPress = () => {
    
  }

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.mainContainer}>

      <View style={styles.container}>
        <View style={styles.spacerDouble} />

        <Image style={{ width: Metrics.clientWidth - Metrics.doubleBaseMargin, height: 300, margin: Metrics.baseMargin }} source={Images.beepLogo} resizeMode="contain" />

        <TextInput
          ref={inputUserNameRef}
          style={styles.input}
          placeholder={t("login.username")}
          onChangeText={setUserName}
          value={userName}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => inputPasswordRef?.current?.focus()}
        />

        <View style={styles.spacerDouble} />

        <TextInput
          ref={inputPasswordRef}
          style={styles.input}
          placeholder={t("login.password")}
          onChangeText={setPassword}
          value={password}
          secureTextEntry={true}
          onSubmitEditing={onLoginPress}
        />

        <View style={styles.spacerDouble} />
                
        <TouchableOpacity onPress={onLoginPress}>
          <Text style={styles.textButton}>{t("login.login")}</Text>
        </TouchableOpacity>

        <View style={styles.spacerDouble} />

      </View>
    </SafeAreaView>
    </SafeAreaProvider>
  )
}

export default LoginScreen