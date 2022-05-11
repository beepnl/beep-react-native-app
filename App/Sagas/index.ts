import { takeLatest, all } from 'redux-saga/effects'
import { StartupTypes } from 'App/Stores/Startup/Actions'
import { ApiTypes } from 'App/Stores/Api/Actions'

import { startup } from './StartupSaga'
import { 
} from './ApiSaga'

export default function* root() {
  yield all([
    takeLatest(StartupTypes.STARTUP, startup),

  ])
}
