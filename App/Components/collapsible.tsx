import { PropsWithChildren, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { ApplicationStyles } from '../Theme';

export function Collapsible({ children, title }: PropsWithChildren & { title?: string }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
      >
        <Text style={[styles.link, { alignSelf: "center" }]}>{t(`wizard.lora.${isOpen ? "hide" : "show"}Details`)}</Text>
      </TouchableOpacity>
      {isOpen && <View>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  ...ApplicationStyles,
  heading: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
});
