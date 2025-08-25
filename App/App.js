import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const App = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Placeholder App for log-storage-tests</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 16, color: '#333' },
});

export default App;

