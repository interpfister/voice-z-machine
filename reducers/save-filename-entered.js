import initialState from './initial-state';

const initReducer = (state = initialState, action) => {
  switch (action.type) {
  case 'FETCH_USERS':
      return Object.assign({}, state, {
          error: null,
          // transition to a different status! 
          status: 'IN_PROGRESS'
  })
  default:
      return state
  }
}

export default initReducer;