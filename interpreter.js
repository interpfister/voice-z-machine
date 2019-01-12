const frotz = require('frotz-interfacer');
const fs = require('fs');

exports.handler = async (event, context) => {
	await fs.copyFile('anchorhead_default.glksave', '/tmp/anchorhead.glksave', (err) => {
	  if (err) throw err;
	  console.log('file copied');
	});

	let interfacer = new frotz({
		//executable: '/path/to/executable', //using default
		gameImage: 'games/anchor.z8',
		saveFile: '/tmp/anchorhead.glksave',
		outputFilter: frotz.filter
	});

	const promise = new Promise((resolve, reject) => {
		interfacer.iteration('east', (error, output) => {
			if (error && error.error) {
				reject(error.error);
			} else {
				resolve(output.pretty.join(' '));
			}
		});
	});
	
	return promise;
}
