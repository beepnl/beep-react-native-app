import { ActionCreators, createActions } from 'reduxsauce';

export enum StartupTypes {
  STARTUP = 'STARTUP',
  STARTUP_LOADING = 'STARTUP_LOADING',
  STARTUP_SUCCESS = 'STARTUP_SUCCESS',
  STARTUP_FAILURE = 'STARTUP_FAILURE',
}

interface C extends ActionCreators {
  startup: () => { type: StartupTypes.STARTUP };
}

const CreatedActions = createActions( {
  startup: null
} );

  /*
  // RESET CLOCK
  */
    
  params = Buffer.alloc(4)
  params.writeUint32BE((new Date().valueOf() + 1300) / 1000, 0)
  yield call(BleHelpers.write, peripheralId, COMMANDS.WRITE_CLOCK, params)


export default CreatedActions.Creators as C;

 
