'use strict';

const spawn = require('cross-spawn');

const invokeShell = (done, query) => {
console.log('invoking shell');  
  const child = spawn('npm', ['run','start-zvm']);
  console.log('shell invoked');
	child.on('error', function( err ){ throw err });
  child.stderr.on('data', (data) => {
	    console.log('err', String(data));
	});
	let returnIndex = 0;
  let returnNext = false;
  let returnText = "";
  let saving = false;
  
  const saveAndFinish = (text) => {
    child.stdin.write('save\n');
    saving = true;
  }
  
  const finish = (text) => {
    child.stdin.pause();
    child.kill();
    done(text.replace('>','').replace(new RegExp(/\n/, 'g'),':'));
  }
  
  const saveFile = 'testsave';
	child.stdout.on('data', (data) => {
	  const text = String(data) && String(data).trim();
    if(text) {
      if(saving) {
        child.stdin.write(`${saveFile}\n`);
        finish(returnText);
      }
      
      console.log(`cmd response ${returnIndex}:`, text);
      if(returnIndex === 2) {
        child.stdin.write('R');
      }
      else if(returnIndex === 3) {
        child.stdin.write(`${saveFile}\n`);
      }
      else if(returnIndex === 4) {
        child.stdin.write(`${query}\n`);
      }
      else if(text.includes(query)) {
        returnText = text.replace(query, '');
        returnNext = true;
        setTimeout(() => {
          saveAndFinish(returnText);
        }, 1000);
      }
      else if(returnNext) {
        returnText = returnText.concat(text);
		if(returnText.includes('>')) {
			saveAndFinish(returnText);
		}
      }	
      
      returnIndex = returnIndex + 1; //we only want to return the last line
    }
	});
};

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

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
