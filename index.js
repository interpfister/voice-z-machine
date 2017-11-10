import makeStore from './store';
import spawn from 'cross-spawn';
import * as Actions from './actions';
import subscribe from './subscriber';

const store = makeStore();
subscribe(store);

const invokeShell = (done, query, saveFilename, newFile = false) => {
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
  let wasSaving = false;
  let restoreCompleted = false;
  let commandEntered = false;

  let backupTimeout;
  let isRestoring = false;
	child.stdout.on('data', (data) => {
    const text = String(data) && String(data).trim();
    
    if(text) {
      console.log(`cmd response ${returnIndex}:`, text);
      store.dispatch(Actions.process(child, text));
    }

	  else if(wasSaving && text.includes('Ok.')) {
      
	  }
      else if(text.includes('to restore; any other key to begin')) {
        isRestoring = true;
		child.stdin.write('R');
      }
      else if(isRestoring) {
        const filenameToRestore = newFile ? 'testsave' : saveFilename; //Restore the default template if it's a new file
        child.stdin.write(`${filenameToRestore}\n`);
		isRestoring = false;
		restoreCompleted = true;
      }
      else if(text.includes(query)) {
        returnText = text.replace(query, '');
        returnNext = true;
        backupTimeout = setTimeout(() => {
          saveAndFinish();
        }, 1000);
      }
      else if(returnNext) {
        returnText = returnText.concat(`:${text}`);
		if(returnText.includes('>')) {
			typeof backupTimeout === 'function' && backupTimeout();
			saveAndFinish();
		}
      }
      else if(restoreCompleted && !commandEntered && text.includes('>')) {
        commandEntered = true;
        child.stdin.write(`${query}\n`);
      }
      
      returnIndex = returnIndex + 1;
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
        return;
			}
      if(!body.originalRequest.source) {
        done('No original request source found', true);
        return;
      }
      
      let username = 'default';
      
      if(body.originalRequest.source.includes('google') && body.originalRequest.data && body.originalRequest.data.user && body.originalRequest.data.user.user_id) {
        username = body.originalRequest.data.user.user_id;
      } else if (body.originalRequest.source.includes('slack') && body.originalRequest.data && body.originalRequest.data.user) {
        username = body.originalRequest.data.user;
      }
      
      const saveFilename = `${body.originalRequest.source}_${username}`;
      
      downloadFileFromS3(saveFilename).then(() =>
        invokeShell(done, query, saveFilename))
        .catch(() => invokeShell(done, query, saveFilename, true));
            break;
        case 'PUT':
            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
