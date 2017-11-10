import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from './reducers';

const makeStore = () => {
  return createStore(reducer, applyMiddleware(thunk));
}