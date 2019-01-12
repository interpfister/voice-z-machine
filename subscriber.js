// THIS IS WHERE I KICK OFF ACTIONS ONCE THE REDUCER HAS DETERMINED THE APPROPRIATE STATE IS PRESENT

const subscribe = (store, actions, restoreFilename, saveFilename, query, done) => {
  store.subscribe(() => {
    switch(store.getState().status) {
      case 'READY_FOR_NO_INSTRUCTIONS_COMMAND':
        store.dispatch(actions.enterNoInstructionsCommand());
        break;
      case 'READY_FOR_BLANK_COMMAND':
        store.dispatch(actions.enterBlankCommand());
        break;
      case 'READY_FOR_RESTORE_COMMAND':
        store.dispatch(actions.enterRestoreCommand());
        break;
      case 'READY_FOR_RESTORE_WORD_COMMAND':
        store.dispatch(actions.enterRestoreWordCommand());
        break;
      case 'READY_FOR_RESTORE_FILENAME':
        store.dispatch(actions.enterRestoreFilename(restoreFilename));
        break;
      case 'READY_FOR_MAIN_COMMAND':
        store.dispatch(actions.enterMainCommand(query));
        break;
      case 'READY_FOR_SAVE_COMMAND':
        store.dispatch(actions.enterSaveCommand());
        break;
      case 'READY_FOR_SAVE_FILENAME':
        store.dispatch(actions.enterSaveFilename(saveFilename));
        break;
      case 'READY_TO_FINISH':
        store.dispatch(actions.finish(done, saveFilename));
        break;
      default:
        // no action
    };
  });
}

module.exports = subscribe;
