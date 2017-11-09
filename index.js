'use strict';

const spawn = require('cross-spawn');
const s3 = require('s3');

const client = s3.createClient({
  s3Options: {
    region: 'us-east-1',
  }
});

const createParams = (filename) => {
  return {
    localFile: filename,
    s3Params: {
      Bucket: "voice-z-machine",
      Key: filename,
    },
  };
}

const handleS3EventEmitter = (emitter) => {
  return new Promise((resolve, reject) => {
    emitter.on('error', function(err) {
      console.error("error:", err.stack);
      reject(err.stack);
    });
    emitter.on('progress', function() {
      console.log("progress", emitter.progressTotal);
    });
    emitter.on('end', function() {
      console.log("done uploading");
      resolve('done uploading');
    });
  });
}

const uploadFileToS3 = (filename) => {
  return handleS3EventEmitter(client.uploadFile(createParams(`${filename}.glksave`)));
}

const downloadFileFromS3 = (filename) => {
  return handleS3EventEmitter(client.downloadFile(createParams(`${filename}.glksave`)));
}

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
  const saveAndFinish = () => {
    child.stdin.write('save\n');
    saving = true;
	returnNext = false;
  }
  
  const finish = (text) => {
    child.stdin.pause();
    child.kill();
    done(text.replace('>',' ').replace(new RegExp(/\n/, 'g'),':'));
  }
  
  let backupTimeout;
  let isRestoring = false;
	child.stdout.on('data', (data) => {
	  const text = String(data) && String(data).trim();
    if(text) {
      console.log(`cmd response ${returnIndex}:`, text);
	  if(saving) {
		  saving = false;
		  wasSaving = true;
        child.stdin.write(`${saveFilename}\n`);
      }
	  else if(wasSaving && text.includes('Ok.')) {
      uploadFileToS3(saveFilename).then(() => finish(returnText));
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
        returnText = returnText.concat(text);
		if(returnText.includes('>')) {
			typeof backupTimeout === 'function' && backupTimeout();
			saveAndFinish();
		}
      }
      else if(restoreCompleted && text.includes('>')) {
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
