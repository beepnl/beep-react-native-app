import { createActions } from 'reduxsauce'

const { Types, Creators } = createActions({
  setAppMode: ['appMode'],
})

export const GlobalTypes = Types
export default Creators