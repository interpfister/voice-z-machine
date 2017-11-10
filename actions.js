import { uploadFileToS3, downloadFileFromS3 } from './s3-functions';

let child;

const triggerSave = () => {
  child.stdin.write('save\n');
  return {
    TYPE: 'SAVE_COMMAND_ENTERED'
  }
}

const enterFilename = () => {
  child.stdin.write(`${saveFilename}\n`);
  return {
    TYPE: 'FILENAME_ENTERED'
  }
}

const finish = (text, done) => {
  child.stdin.pause();
  child.kill();
  done(text.replace('>',' ').replace(new RegExp(/\n/, 'g'),':'));
}

const saveCompleted = (done) => {
  return (dispatch, state) => {
    uploadFileToS3(saveFilename).then(() => dispatch(finish(returnText)))
      .catch(() =>
        dispatch(finish(`${returnText} - WARNING: Save to Amazon S3 failed.`)));
  }
}

const process = (childPassedIn, text) => {
  child = childPassedIn;
  return {
    text
  }
}