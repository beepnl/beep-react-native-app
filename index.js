import { AppRegistry } from 'react-native';
import App from './App/App';

if (typeof Buffer === 'undefined') global.Buffer = require('buffer').Buffer

AppRegistry.registerComponent('main', () => App);
