'use strict';

const spawn = require('cross-spawn');

const invokeShell = (done, query) => {
    const child = spawn('npm', ['start']);
	child.on('error', function( err ){ throw err });
  child.stderr.on('data', (data) => {
	    console.log('err', String(data));
	});
	let returnIndex = 0;
	child.stdout.on('data', (data) => {
	  const text = String(data);
	  console.log(`cmd response ${returnIndex}:`, text);
	  if(returnIndex === 2) {
		child.stdin.write('R');
	  }
	  if(returnIndex === 3) {
		child.stdin.write('testsave\n');
	  }
	  if(returnIndex === 6) {
		child.stdin.write(`${query}\n`);
	  }
	  if(returnIndex === 8) {
		child.stdin.pause();
		child.kill();
		done(text);
	  }	
	  returnIndex = returnIndex + 1; //we only want to return the last line
	});
};

exports.handler = (event, context, callback) => {
    // console.log('Received event:', JSON.stringify(event, null, 2));

    const done = (speech, err) => callback(null, {
        statusCode: err ? '400' : '200',
        body: JSON.stringify({ speech }),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    const body = JSON.parse(event.body);

    switch (event.httpMethod) {
        case 'DELETE':
            break;
        case 'GET':
            break;
        case 'POST':
            const query = body.result && body.result.resolvedQuery;
			if(!query) {
				done('No query found', true);
			}
			invokeShell(done, query);
            break;
        case 'PUT':
            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
