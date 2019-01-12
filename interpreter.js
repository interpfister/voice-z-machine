const frotz = require("frotz-interfacer");
const fs = require("fs");
const debug = require("debug")("interpreter");
const errorDebug = require("debug")("error");
const uploadFileToS3 = require("./s3-functions").uploadFileToS3;

const GAME_FILENAMES = {
  anchorhead: "games/anchor.z8",
  lostpig: "games/lostpig.z8",
  photopia: "games/photopia.z5"
};

module.exports = async (
  selectedGame,
  filenameToRestore,
  saveFilename,
  query
) => {
  const savePath = `/tmp/${saveFilename}.glksave`;
  if (!fs.existsSync(savePath)) {
    await fs.copyFile(filenameToRestore + ".glksave", savePath, err => {
      if (err) {
        errorDebug(`${filenameToRestore} did not exist`);
      } else {
        debug(`${filenameToRestore} copied`);
      }
    });
  }

  let interfacer = new frotz({
    //executable: '/path/to/executable', //using default
    gameImage: GAME_FILENAMES[selectedGame],
    saveFile: savePath,
    outputFilter: frotz.filter
  });

  const promise = new Promise((resolve, reject) => {
    interfacer.iteration(query, (error, output) => {
      if (error && error.error) {
        reject(error.error);
      } else {
        //await uploadFileToS3(saveFilename);
        resolve(
          output.pretty
            .slice(2)
            .join("")
            .trim()
        );
      }
    });
  });

  return promise;
};
