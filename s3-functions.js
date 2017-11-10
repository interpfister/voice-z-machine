import s3 from 's3';

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


export const uploadFileToS3 = (filename) => {
  return handleS3EventEmitter(client.uploadFile(createParams(`${filename}.glksave`)));
}

export const downloadFileFromS3 = (filename) => {
  return handleS3EventEmitter(client.downloadFile(createParams(`${filename}.glksave`)));
}