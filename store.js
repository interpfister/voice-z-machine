const redux = require('redux');
const thunk = require('redux-thunk').default;
const reducer = require('./reducers');
const composeWithDevTools = require('remote-redux-devtools').composeWithDevTools;

const makeStore = (selectedGame) => {
  return redux.createStore(reducer(selectedGame), composeWithDevTools(redux.applyMiddleware(thunk)));
}

module.exports = makeStore;
