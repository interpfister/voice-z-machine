const downloadFileFromS3 = require("./s3-functions").downloadFileFromS3;
const getSelectedGame = require("./dynamo-functions").getSelectedGame;
const updateSelectedGame = require("./dynamo-functions").updateSelectedGame;
const debug = require("debug")("index");
const errorDebug = require("debug")("error");
const ua = require("universal-analytics");
const interpreter = require("./interpreter");

const invokeShell = (
  done,
  query,
  saveFilename,
  newFile = false,
  selectedGame
) => {
  //Restore the default template if it's a new file
  const filenameToRestore = newFile ? `${selectedGame}_default` : saveFilename;

  interpreter(selectedGame, filenameToRestore, saveFilename, query, done);
};

exports.handler = (event, context, callback) => {
  debug("START: Received event:", JSON.stringify(event, null, 2));

  let gaParams = { documentPath: "/start" };
  const startTime = new Date();

  const failsafeTimeout = setTimeout(() => {
    errorDebug("Response timed out for query", event);
    done(
      `Sorry - I couldn't respond in time. Please try your command again.`,
      true
    );
  }, process.env.FAILSAFE_TIMEOUT || 5000);

  const done = (speech, err) => {
    typeof failsafeTimeout === "function" && failsafeTimeout(); //deactivate timeout

    gaParams.pageLoadTime = new Date() - startTime;
    const visitor = ua(process.env.GA_TRACKING_ID, gaParams.uid, {
      strictCidFormat: false
    });

    const gaCallback = gaErr => gaErr && debug(`GA ERROR: ${gaErr}`);
    err
      ? visitor.exception(gaParams, gaCallback)
      : visitor.pageview(gaParams, gaCallback);

    callback(null, {
      statusCode: err ? "400" : "200",
      body: JSON.stringify({ speech }),
      headers: {
        "Content-Type": "application/json"
      }
    });
  };

  const body = JSON.parse(event.body);

  switch (event.httpMethod) {
    case "POST":
      const query = body.result && body.result.resolvedQuery;
      if (!query) {
        done("No query found", true);
        return;
      }
      const source =
        body.originalRequest && body.originalRequest.source
          ? body.originalRequest.source
          : "no-source";
      gaParams.cs = source;
      gaParams.cn = source;
      gaParams.cm = source;
      gaParams.dr = `https://${source}.com`;

      let username = "default";

      if (
        source.includes("google") &&
        body.originalRequest.data &&
        body.originalRequest.data.user &&
        body.originalRequest.data.user.user_id
      ) {
        username = body.originalRequest.data.user.user_id;
      } else if (
        source.includes("slack") &&
        body.originalRequest.data &&
        body.originalRequest.data.user
      ) {
        username = body.originalRequest.data.user;
      } else if (
        source.includes("facebook") &&
        body.originalRequest.data &&
        body.originalRequest.data.sender &&
        body.originalRequest.data.sender.id
      ) {
        username = body.originalRequest.data.sender.id;
      } else if (
        source.includes("twitter") &&
        body.originalRequest.data &&
        body.originalRequest.data.in_reply_to_user_id_str
      ) {
        username = body.originalRequest.data.in_reply_to_user_id_str;
      } else if (body.sessionId) {
        username = body.sessionId; // for web demo
      }

      const CHANGE_GAME_STRINGS = ["change game to", "change game 2"];
      const AVAILABLE_GAMES = [
        {
          name: "anchorhead",
          alternates: ["anchor head"]
        },
        {
          name: "lostpig",
          alternates: ["lost pig"]
        },
        {
          name: "photopia",
          alternates: ["photo pia", "four topia"]
        }
      ];
      const gameNames = AVAILABLE_GAMES.map(game => game.name).join(", ");
      if (
        CHANGE_GAME_STRINGS.some(changeString =>
          query.toLowerCase().includes(changeString)
        )
      ) {
        let stringWithChangeGamePartRemoved = query.toLowerCase();
        CHANGE_GAME_STRINGS.forEach(stringToRemove => {
          stringWithChangeGamePartRemoved = stringWithChangeGamePartRemoved.replace(
            stringToRemove,
            ""
          );
        });
        const updatedGameQuery = stringWithChangeGamePartRemoved
          .trim()
          .toLowerCase();
        debug("updatedGameQuery", updatedGameQuery);
        const updatedGame = AVAILABLE_GAMES.find(game => {
          return (
            game.alternates.some(alternate =>
              alternate.includes(updatedGameQuery)
            ) || game.name.includes(updatedGameQuery)
          );
        });
        if (updatedGame) {
          updateSelectedGame(username, updatedGame.name)
            .then(() => {
              done(
                `Game changed to: ${
                  updatedGame.name
                }. Say a command like 'look' or 'west' to get started.`
              );
            })
            .catch(err =>
              done(`Error updating selected game name in dynamo: ${err}`)
            );
        } else {
          done(
            `Game not found. Please say 'change game to' one of the following: ${gameNames}`
          );
        }
      } else {
        getSelectedGame(username)
          .then(selectedGame => {
            if (!selectedGame) {
              updateSelectedGame(username, "anchorhead")
                .then(() => {
                  done(
                    `We'll start you playing Anchorhead, but you can change games at any time by saying: 'change game to' one of the following: ${gameNames}`
                  );
                })
                .catch(err =>
                  done(`Error updating selected game name in dynamo: ${err}`)
                );
            } else if (query.includes("start")) {
              // This is if the user said start even though they already have a game selected
              done(
                `You're playing ${selectedGame}. Say a command like 'look' or 'west' to get started.`
              );
            } else {
              const saveFilename = `${source}_${username}_${selectedGame}`;

              gaParams.uid = `${source}-${username}`;
              gaParams.documentPath = `/${selectedGame}/${encodeURI(query)}`;

              downloadFileFromS3(saveFilename)
                .then(() =>
                  invokeShell(done, query, saveFilename, false, selectedGame)
                )
                .catch(() =>
                  invokeShell(done, query, saveFilename, true, selectedGame)
                );
            }
          })
          .catch(err =>
            done(`Error getting selected game name in dynamo: ${err}`)
          );
      }
      break;
    default:
      done(new Error(`Unsupported method "${event.httpMethod}"`));
  }
};
