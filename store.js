const redux = require('redux');
const thunk = require('redux-thunk').default;
const reducer = require('./reducers');
const composeWithDevTools = require('remote-redux-devtools').composeWithDevTools;

const makeStore = () => {
  return redux.createStore(reducer, composeWithDevTools(redux.applyMiddleware(thunk)));
}

module.exports = makeStore;
