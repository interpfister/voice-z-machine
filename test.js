const index = require('./index');
const yesno = require('yesno');

const body = {
	result: {
		resolvedQuery: 'change game to anchorhead',
	},
  originalRequest: {
    source: 'google',
    data: {
      user: {
        user_id: 'test-user',
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

  if(process.argv.length > 2 && process.argv[2] === '--pause') {
    yesno.ask('Press enter to exit, or view the state actions at: http://remotedev.io/local/', true, () => {
      process.exit();
    });
  } else {
    process.exit();
  }
}

index.handler(event, {}, callback);