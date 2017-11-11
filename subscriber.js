// THIS IS WHERE I KICK OFF ACTIONS ONCE THE REDUCER HAS DETERMINED THE APPROPRIATE STATE IS PRESENT

const subscribe = (store, actions, filename, query, done) => {
  store.subscribe(() => {
    switch(store.getState().status) {
      case 'READY_FOR_RESTORE_COMMAND':
        store.dispatch(actions.enterRestoreCommand());
        break;
      case 'READY_FOR_RESTORE_FILENAME':
        store.dispatch(actions.enterRestoreFilename(filename));
        break;
      case 'READY_FOR_MAIN_COMMAND':
        store.dispatch(actions.enterMainCommand(query));
        break;
      case 'READY_FOR_SAVE_COMMAND':
        store.dispatch(actions.enterSaveCommand());
        break;
      case 'READY_FOR_SAVE_FILENAME':
        store.dispatch(actions.enterSaveFilename(filename));
        break;
      case 'READY_TO_FINISH':
        store.dispatch(actions.finish(done, filename));
        break;
      default:
        // no action
    };
  });
}

module.exports = subscribe;
