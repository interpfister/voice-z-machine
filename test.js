const index = require('./index');

const body = {
	result: {
		resolvedQuery: 'look',
	},
  originalRequest: {
    source: 'google',
    data: {
      user: {
        user_id: 'test-ryan',
      }
    },
  },
}
const event = {
	httpMethod: 'POST',
	body: JSON.stringify(body),
}

const callback = (something, result) => {
	console.log('RESULT:', result);
	process.exit();
}

index.handler(event, {}, callback);
