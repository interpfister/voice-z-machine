import { createMachine } from 'redux-machine';
import initialState from './initial-state';

const INIT = (state = initialState, action) => {
  if(action.text.includes('to restore; any other key to begin')) {
    return {
      ...state,
      STATUS: READY_FOR_RESTORE,
    }
  }
  return state;
}

const READY_FOR_RESTORE = (state = initialState, action) => {
  if(action.type === 'RESTORE_COMMAND_ENTERED') {
    return {
      ...state,
      STATUS: RESTORE_COMMAND_ENTERED,
    }
  }
  return state;
}

const RESTORE_COMMAND_ENTERED = (state = initialState, action) => {
  if(/* todo check for command prompt text */ true) {
    return {
      ...state,
      STATUS: WAITING_FOR_RESTORE_PROMPT,
    }
  }
  return state;
}

const WAITING_FOR_RESTORE_PROMPT = (state = initialState, action) => {
  if(action.type === 'RESTORE_COMMAND_ENTERED') {
    return {
      ...state,
      STATUS: RESTORE_FILENAME_ENTERED,
    }
  }
  return state;
}

const rootReducer = createMachine({
   INIT,
   READY_FOR_RESTORE,
   RESTORE_COMMAND_ENTERED,
   WAITING_FOR_RESTORE_PROMPT,
   READY_FOR_RESTORE_FILENAME,
   RESTORE_FILENAME_ENTERED,
   RESTORE_COMPLETED, //ready for command
   COMMAND_ENTERED,
   COMMAND_RECEIVED,
   SAVE_COMMAND_ENTERED,
   SAVE_FILENAME_ENTERED,
   READY_TO_FINISH,
});

export default rootReducer;

