import * as Actions from './actions';

const handleChange = (store) => {
  switch(store.getState().status) {
    case RESTORE_COMMAND_ENTERED:
      store.dispatch(Actions.enterFilename());
      break;
    default:
      // no action
  };
}

const subscribe = (store) => {
  store.subscribe(() => {
    handleChange(store);
  });
}

export default subscribe;
