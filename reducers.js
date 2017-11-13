const createMachine = require('redux-machine').createMachine;

const initialState = {
  status: 'INIT',
  returnText: '',
}

const logState = (state, action) => {
  process.env.REDUX_LOGGING && console.log(`ACTION: ${JSON.stringify(action)} -- STATE: ${JSON.stringify(state)}`);
}
const textMatchReducer = (textToMatch, newStatus) => {
  return (state = initialState, action) => {
    logState(state, action);
    if(action.type === 'PROCESS_TEXT' && action.payload.text && action.payload.text.toLowerCase().includes(textToMatch.toLowerCase())) {
      return Object.assign(state, { status: newStatus });
    }
    return state;
  }
}

const typeMatchReducer = (type, newStatus) => {
  return (state = initialState, action) => {
    logState(state, action);
    if(action.type === type) {
      return Object.assign(state, { status: newStatus });
    }
    return state;
  }
}

const mainCommandResponseReducer = (state = initialState, action) => {
  const updatedState =
    action.type === 'PROCESS_TEXT' && action.payload.text ?
      Object.assign(state, {
        returnText: state.returnText.concat(action.payload.text),
      }) : state;  
  return textMatchReducer('>', 'READY_FOR_SAVE_COMMAND')(updatedState, action);
}

const FILENAME_PROMPT = 'Please enter a file name';

const regularFlow = {
  WAITING_FOR_RESTORE_PROMPT: textMatchReducer(FILENAME_PROMPT, 'READY_FOR_RESTORE_FILENAME'),
  READY_FOR_RESTORE_FILENAME: typeMatchReducer('RESTORE_FILENAME_ENTERED', 'WAITING_FOR_RESTORE'),
  WAITING_FOR_RESTORE: textMatchReducer('>', 'READY_FOR_MAIN_COMMAND'),
  READY_FOR_MAIN_COMMAND: typeMatchReducer('MAIN_COMMAND_ENTERED', 'WAITING_FOR_MAIN_COMMAND_RESPONSE'),
  WAITING_FOR_MAIN_COMMAND_RESPONSE: mainCommandResponseReducer,
  READY_FOR_SAVE_COMMAND: typeMatchReducer('SAVE_COMMAND_ENTERED', 'WAITING_FOR_SAVE_COMMAND_RESPONSE'),
  WAITING_FOR_SAVE_COMMAND_RESPONSE: textMatchReducer(FILENAME_PROMPT, 'READY_FOR_SAVE_FILENAME'),
  READY_FOR_SAVE_FILENAME: typeMatchReducer('SAVE_FILENAME_ENTERED', 'WAITING_FOR_SAVE_RESPONSE'),
  WAITING_FOR_SAVE_RESPONSE: textMatchReducer('Ok.', 'READY_TO_FINISH'),
  READY_TO_FINISH: typeMatchReducer('SAVED_FILE_AND_CLOSED_CHILD', 'FINISHED'),
  FINISHED: (state) => {
    return state; // no actions to monitor for - we should be done now
  },
}

const getGameStates = (selectedGame) => {
  switch (selectedGame) {
    case 'anchorhead':
      return Object.assign(regularFlow, {
        INIT: textMatchReducer('to restore; any other key to begin', 'READY_FOR_RESTORE_COMMAND'),
        READY_FOR_RESTORE_COMMAND: typeMatchReducer('RESTORE_COMMAND_ENTERED', 'WAITING_FOR_RESTORE_PROMPT'),
      });
    case 'lostpig':
      return Object.assign(regularFlow, {
        INIT: textMatchReducer('>', 'READY_FOR_RESTORE_WORD_COMMAND'),
        READY_FOR_RESTORE_WORD_COMMAND: typeMatchReducer('RESTORE_COMMAND_ENTERED', 'WAITING_FOR_RESTORE_PROMPT'),
      });
    case 'photopia':
      return Object.assign(regularFlow, {
        INIT: textMatchReducer('instructions?', 'READY_FOR_NO_INSTRUCTIONS_COMMAND'),
        READY_FOR_NO_INSTRUCTIONS_COMMAND: typeMatchReducer('NO_INSTRUCTIONS_COMMAND_ENTERED', 'WAITING_FOR_NEXT_LINE'),
        WAITING_FOR_NEXT_LINE: textMatchReducer('', 'READY_FOR_BLANK_COMMAND'),
        READY_FOR_BLANK_COMMAND: typeMatchReducer('BLANK_COMMAND_ENTERED', 'WAITING_FOR_CARROT'),
        WAITING_FOR_CARROT: textMatchReducer('>', 'READY_FOR_RESTORE_WORD_COMMAND'),
        READY_FOR_RESTORE_WORD_COMMAND: typeMatchReducer('RESTORE_COMMAND_ENTERED', 'WAITING_FOR_RESTORE_PROMPT'),
      });
  }
}

const rootReducer = (selectedGame) => {
  console.log('SELECTED GAME', selectedGame);
  const gameStates = getGameStates(selectedGame);
  return createMachine(gameStates);
}

module.exports = rootReducer;

