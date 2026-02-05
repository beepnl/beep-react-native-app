import React, { FunctionComponent } from 'react';
import { View, Switch, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/App/Theme';
import { Fonts, Metrics } from '@/App/Theme';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  onLabelStyle?: TextStyle;
  offLabelStyle?: TextStyle;
  containerStyle?: ViewStyle;
  trackColor?: {
    false: string;
    true: string;
  };
  thumbColor?: string;
}

const ToggleSwitch: FunctionComponent<ToggleSwitchProps> = ({
  value,
  onValueChange,
  onLabel = 'On',
  offLabel = 'Off',
  onLabelStyle,
  offLabelStyle,
  containerStyle,
  trackColor = { false: Colors.lightGrey, true: Colors.lightGrey },
  thumbColor = Colors.yellow,
}) => {
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Metrics.baseMargin,
      gap: Metrics.baseMargin,
    },
    labelsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Metrics.baseMargin,
    },
    label: {
      ...Fonts.style.regular,
      fontWeight: '500',
      minWidth: 45,
      textAlign: 'center',
    },
    activeLabel: {
      color: Colors.black,
      fontWeight: 'bold',
    },
    inactiveLabel: {
      color: Colors.darkGrey,
      opacity: 0.6,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelsContainer}>
        <Text
          style={[
            styles.label,
            !value ? styles.activeLabel : styles.inactiveLabel,
            !value ? offLabelStyle : undefined,
          ]}
          allowFontScaling={false}
        >
          {offLabel}
        </Text>
      </View>

      <Switch
        trackColor={trackColor}
        thumbColor={thumbColor}
        value={value}
        onValueChange={onValueChange}
      />

      <View style={styles.labelsContainer}>
        <Text
          style={[
            styles.label,
            value ? styles.activeLabel : styles.inactiveLabel,
            value ? onLabelStyle : undefined,
          ]}
          allowFontScaling={false}
        >
          {onLabel}
        </Text>
      </View>
    </View>
  );
};

export default ToggleSwitch;
