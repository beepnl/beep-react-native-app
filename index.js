/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App/App';
import {name as appName} from './app.json';

if (typeof Buffer === 'undefined') global.Buffer = require('buffer').Buffer

// Fix when Buffer.subarray is not a Buffer (see also https://github.com/feross/buffer/issues/329)
if (!(Buffer.alloc(1).subarray(0, 1) instanceof Buffer)) {
  Buffer.prototype.subarray = function subarray() {
    const result = Uint8Array.prototype.subarray.apply(this, arguments);
    Object.setPrototypeOf(result, Buffer.prototype);
    return result;
  };
}

AppRegistry.registerComponent(appName, () => App);
