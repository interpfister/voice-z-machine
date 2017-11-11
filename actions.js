const uploadFileToS3 = require('./s3-functions').uploadFileToS3;

// THESE ARE THE ACTUAL ACTIONS TO TAKE - TRIGGERED BY STATE CHANGES

const Actions = (child) => {
  const commandAndReturn = (type) => {
    return (commandText) => {
      console.log('writing to command line:', commandText);
      child.stdin.write(commandText);
      return {
        type,
      }
    }
  }

  const commandWithNewlineAndReturn = (type) => {
    return (commandText) => commandAndReturn(type)(`${commandText}\n`);
  }
  
  this.enterRestoreCommand = () => commandAndReturn('RESTORE_COMMAND_ENTERED')('R');

  this.enterRestoreFilename = commandWithNewlineAndReturn('RESTORE_FILENAME_ENTERED');
  
  this.enterMainCommand = (command) => {
    return (dispatch) => {
      dispatch(commandWithNewlineAndReturn('MAIN_COMMAND_ENTERED')(command));
    }
  }
  
  this.enterSaveCommand = () => commandWithNewlineAndReturn('SAVE_COMMAND_ENTERED')('save');
  
  this.enterSaveFilename = commandWithNewlineAndReturn('SAVE_FILENAME_ENTERED');
    
  this.closeAndReturn = (text, done) => {
    child.stdin.pause();
    child.kill();
    done(text.replace('>',' ').replace(new RegExp(/\n/, 'g'),':'));
    return { type: 'SAVED_FILE_AND_CLOSED_CHILD' };
  }
  
  this.finish = (done, saveFilename) => {
    return (dispatch, getState) => {
      uploadFileToS3(saveFilename).then(() => dispatch(this.closeAndReturn(getState().returnText, done)))
        .catch(() =>
          dispatch(this.closeAndReturn(`${getState().returnText} - WARNING: Save to Amazon S3 failed.`, done)));
    }
  }
  
  this.processText = (text) => {
    return {
      type: 'PROCESS_TEXT',
      payload: {
        text
      }
    }
  }

  return this;
}

module.exports = Actions;
