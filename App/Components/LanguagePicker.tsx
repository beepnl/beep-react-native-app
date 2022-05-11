import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useNavigation } from 'react-navigation-hooks';
import { useTranslation } from 'react-i18next';

// Styles
import { Metrics, Colors, Fonts, ApplicationStyles } from '../Theme';

// Utils

// Redux
import { LanguageModel } from '../Models/LanguageModel';

// Components
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const Languages: Array<LanguageModel> = [
  {
    name: "Dutch",
    nativeName: "Nederlands",
    code: "nl",
    flag: "🇳🇱",
  },
  {
    name: "English",
    nativeName: "English",
    code: "en",
    flag: "🇬🇧",
  },
  {
    name: "German",
    nativeName: "Deutsch",
    code: "de",
    flag: "🇩🇪",
  },
  {
    name: "French",
    nativeName: "Français",
    code: "fr",
    flag: "🇫🇷",
  },
]

const getLanguageByCode = (languageCode: string) => {
  return Languages.find(language => language.code == languageCode)
}

interface LanguageItemProps {
  languageCode: string,
  onSelect?: (language: LanguageModel) => void,
  showLabel?: boolean,
  showIcon?: boolean,
  color?: string,
}

export const LanguageItem: FunctionComponent<LanguageItemProps> = ({
  languageCode,
  onSelect,
  showIcon = false,
  showLabel = true,
  color,
}) => {
  const language = getLanguageByCode(languageCode)

  if (language) {
    return (
      <TouchableOpacity 
        style={styles.languageContainer} 
        onPress={() => onSelect && onSelect(language)}
      >
        { showIcon &&
          <Text style={styles.languageFlag}>{language.flag}</Text>
        }
        { showIcon && showLabel &&
          <View style={ApplicationStyles.spacer} />
        }
        { showLabel &&
          <Text style={[styles.languageText, !!color && { color }]}>{language.nativeName}</Text>
        }
      </TouchableOpacity>
    )
  }

  return null
}

interface Props {
  onSelect?: (language: LanguageModel) => void,
  showLabel?: boolean,
  showIcon?: boolean,
}

const LanguagePicker: FunctionComponent<Props> = ({
  onSelect,
  showIcon = false,
  showLabel = true,
}) => {
  return (
    <View>
      { Languages.map((language: LanguageModel) => <LanguageItem key={language.code} languageCode={language.code} onSelect={onSelect} showIcon={showIcon} showLabel={showLabel} />)}
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    ...Fonts.style.heading,
    alignSelf: "center",
    marginBottom: Metrics.doubleBaseMargin,
    color: Colors.white
  },

  languageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  languageFlag: {
    fontSize: 40,
  },

  languageText: {
    ...ApplicationStyles.text,
    lineHeight: 50,
  },
})

export default LanguagePicker