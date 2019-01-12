const frotz = require("frotz-interfacer");
const fs = require("fs");
const debug = require("debug")("interpreter");
const errorDebug = require("debug")("error");

const GAME_FILENAMES = {
  anchorhead: "games/anchor.z8",
  lostpig: "games/lostpig.z8",
  photopia: "games/photopia.z5"
};

module.exports.handler = async (event, context) => {
  const savePath = `/tmp/anchrohead.glksave`;
  const filenameToRestore = "anchorhead_default";
  await fs.copyFile(filenameToRestore + ".glksave", savePath, err => {
    if (err) {
      errorDebug(`${filenameToRestore} did not exist`);
    } else {
      debug(`${filenameToRestore} copied`);
    }
  });

  console.log("GOT BEFORE INTERFACER");

  let interfacer = new frotz({
    //executable: '/path/to/executable', //using default
    gameImage: GAME_FILENAMES["anchorhead"],
    saveFile: savePath,
    outputFilter: frotz.filter
  });

  const promise = new Promise((resolve, reject) => {
    interfacer.iteration("look", (error, output) => {
      if (error && error.error) {
        console.log("GOT AN ERROR");
        reject(error.error);
      } else {
        console.log("GOT TO OUTPUT");
        resolve(output.pretty);
      }
    });
  });

  console.log("GOT AFTER INTERFACER");

  return promise;
};
