const s3 = require('s3');
const debug = require('debug')('s3');

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
      debug("error:", err.stack);
      reject(err.stack);
    });
    emitter.on('progress', function() {
      // console.log("progress", emitter.progressTotal);
    });
    emitter.on('end', function() {
      debug("done download/upload");
      resolve('done download/upload');
    });
  });
}


const uploadFileToS3 = (filename) => {
  return handleS3EventEmitter(client.uploadFile(createParams(`${filename}.glksave`)));
}

const downloadFileFromS3 = (filename) => {
  return handleS3EventEmitter(client.downloadFile(createParams(`${filename}.glksave`)));
}

module.exports = {
  uploadFileToS3,
  downloadFileFromS3
}