const makeStore = require('./store');
const spawn = require('cross-spawn');
const Actions = require('./actions');
const subscribe = require('./subscriber');
const downloadFileFromS3 = require('./s3-functions').downloadFileFromS3;

const invokeShell = (done, query, saveFilename, newFile = false) => {
  const store = makeStore();
  const child = spawn('npm', ['run','start-anchorhead']);
	child.on('error', function( err ){ throw err });
  child.stderr.on('data', (data) => {
	    console.log('err', String(data));
  });
  const actions = Actions(child);
  
  //Restore the default template if it's a new file
  const filenameToRestore = newFile ? 'testsave' : saveFilename;
  
  subscribe(store, actions, filenameToRestore, query, done);

  returnIndex = 0;
	child.stdout.on('data', (data) => {
    const text = String(data) && String(data).trim().replace(query, '');
    
    if(text) {
      console.log(`cmd response ${returnIndex}:`, text);
      store.dispatch(actions.processText(text));
      returnIndex = returnIndex + 1;
    }
	});
};

exports.handler = (event, context, callback) => {
    console.log('START: Received event:', JSON.stringify(event, null, 2));

    const done = (speech, err) => callback(null, {
        statusCode: err ? '400' : '200',
        body: JSON.stringify({ speech }),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    const body = JSON.parse(event.body);

    switch (event.httpMethod) {
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
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
