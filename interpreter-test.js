const interpreter = require('./interpreter');

interpreter.handler().then((result) => {
	console.log(result);
});