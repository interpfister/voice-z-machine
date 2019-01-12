const AWS = require('aws-sdk');
const debug = require('debug')('dynamo');

const dynamoDb = new AWS.DynamoDB({
  region: 'us-east-1',
});

const TABLE_NAME = "voice-z-machine";

const getSelectedGame = (userId) => {
  var params = {
    Key: {
      UserId: {
        S: userId
      }, 
    },
    TableName: TABLE_NAME,
  };
  return new Promise((resolve, reject) => {
    dynamoDb.getItem(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Item && data.Item.SelectedGameName && data.Item.SelectedGameName.S);
      }
    });
  });
}

const updateSelectedGame = (userId, selectedGameName) => {
  const params = {
    Item: {
      UserId: {
        S: userId
      },
      SelectedGameName: {
        S: selectedGameName
      }
    },
    TableName: TABLE_NAME,
  };
  debug(params);
  return new Promise((resolve, reject) => {
    dynamoDb.putItem(params, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}

module.exports = {
  getSelectedGame,
  updateSelectedGame,
}