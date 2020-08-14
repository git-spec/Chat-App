const moment = require('moment');
const runQuery = require('./connection');

function insertMessage(message, userID, roomID) {
  return new Promise((resolve, reject) => {
    runQuery(`
              INSERT INTO messages (message, message_time, userID, roomID)
              Values ('${message}', '${new Date()}','${userID}', '${roomID}')
    `).then(() => {
      resolve()
    }).catch(err => {
      reject(err)
    });
  });
};

function getMessage(userID) {
  return new Promise((resolve, reject) => {
    runQuery('SELECT * FROM messages').then(message => {
      resolve(message)
    }).catch(err => {
      reject(err)
    });
  });
};

function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().format('h:mm a')
  };
}

module.exports = {
  insertMessage,
  getMessage,
  formatMessage
};
