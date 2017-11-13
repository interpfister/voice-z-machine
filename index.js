const makeStore = require('./store');
const spawn = require('cross-spawn');
const Actions = require('./actions');
const subscribe = require('./subscriber');
const downloadFileFromS3 = require('./s3-functions').downloadFileFromS3;
const getSelectedGame = require('./dynamo-functions').getSelectedGame;
const updateSelectedGame = require('./dynamo-functions').updateSelectedGame;

const invokeShell = (done, query, saveFilename, newFile = false, selectedGame) => {
  const store = makeStore(selectedGame);
  const child = spawn('npm', ['run',`start-${selectedGame}`]);
	child.on('error', function( err ){ throw err });
  child.stderr.on('data', (data) => {
	    console.log('err', String(data));
  });
  const actions = Actions(child);
  
  //Restore the default template if it's a new file
  const filenameToRestore = newFile ? `${selectedGame}_default` : saveFilename;

  subscribe(store, actions, filenameToRestore, saveFilename, query, done);

  returnIndex = 0;
	child.stdout.on('data', (data) => {
    const text = String(data).trim().replace(query, '');
    
    console.log(`cmd response ${returnIndex}:`, text);
    store.dispatch(actions.processText(text));
    returnIndex = returnIndex + 1;
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

        const CHANGE_GAME_STRINGS = ['change game to','change game 2'];
        const AVAILABLE_GAMES = [
        {
          name: 'anchorhead',
          alternates: ['anchor head']
        },
        {
          name: 'lostpig',
          alternates: ['lost pig']
        },
        {
          name: 'photopia',
          alternates: ['photo pia','four topia']
        }
        ];
        const gameNames = AVAILABLE_GAMES.map((game) => game.name).join(', ');
        if (CHANGE_GAME_STRINGS.some((changeString) => query.toLowerCase().includes(changeString))) {
          let stringWithChangeGamePartRemoved = query.toLowerCase();
          CHANGE_GAME_STRINGS.forEach((stringToRemove) => {
            stringWithChangeGamePartRemoved = stringWithChangeGamePartRemoved.replace(stringToRemove, '');
            console.log('TEST', stringToRemove, stringWithChangeGamePartRemoved);
          })
          const updatedGameQuery = stringWithChangeGamePartRemoved.trim().toLowerCase();
          console.log('updatedGameQuery', updatedGameQuery);
          const updatedGame = AVAILABLE_GAMES.find((game) => {
            return game.alternates.some((alternate) => alternate.includes(updatedGameQuery)) || game.name.includes(updatedGameQuery);
          });
          if(updatedGame) {
            updateSelectedGame(username, updatedGame.name).then(() => {
              done(`Game changed to: ${updatedGame.name}. Say a command like 'look' or 'west' to get started.`);
            }).catch((err) => done(`Error updating selected game name in dynamo: ${err}`));
          } else {
            done(`Game not found. Please say 'change game to' one of the following: ${gameNames}`);
          }
        } else {
          getSelectedGame(username).then((selectedGame) => {
            if (!selectedGame) {
              updateSelectedGame(username, 'anchorhead').then(() => {
                done(`We'll start you playing Anchorhead, but you can change games at any time by saying: 'change game to' one of the following: ${gameNames}`);
              }).catch((err) => done(`Error updating selected game name in dynamo: ${err}`));
            } else if (query.includes('start')) {
              // This is if the user said start even though they already have a game selected
              done(`You're playing ${selectedGame}. Say a command like 'look' or 'west' to get started.`);
            } else {
              const saveFilename = `${body.originalRequest.source}_${username}_${selectedGame}`;
              
              downloadFileFromS3(saveFilename).then(() =>
                invokeShell(done, query, saveFilename, false, selectedGame))
                .catch(() => invokeShell(done, query, saveFilename, true, selectedGame));
            }
          }).catch((err) => done(`Error getting selected game name in dynamo: ${err}`));
        }
        break;
      default:
          done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
