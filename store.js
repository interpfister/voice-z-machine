const redux = require('redux');
const thunk = require('redux-thunk').default;
const reducer = require('./reducers');

const makeStore = () => {
  return redux.createStore(reducer, redux.applyMiddleware(thunk));
}

module.exports = makeStore;
