const moment = require('moment');
const runQuery = require('./connection');

function insertMessage(message, userID, roomID) {
  return new Promise((resolve, reject) => {
    // replace backslashes in a message with their entity to avoid errors in mySQL and JSON
    runQuery(`
              INSERT INTO messages (message, userID, roomID)
              Values ('${message.replace(/\\/g, "&#92;")}', ${userID}, ${roomID})
    `).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    });
  });
};

function getMessages(roomName) {
  return new Promise((resolve, reject) => {
    runQuery(`
              SELECT messages.*, users.username as username FROM messages
              INNER JOIN rooms ON messages.roomID = rooms.ID
              INNER JOIN users ON messages.userID = users.ID
              WHERE rooms.room LIKE '${roomName}' ORDER BY message_time
    `).then(messages => {
      resolve(messages.map(message => {
        message.message = message.message.toString();
        return message;
      }));
    }).catch(err => {
      reject(err);
    });
  });
};
/*
function getMessage(userID) {
  return new Promise((resolve, reject) => {
    runQuery('SELECT * FROM messages').then(message => {
      resolve(message);
    }).catch(err => {
      reject(err);
    });
  });
};
*/
function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().format('DD.MM.YY H:mm')
  };
};

module.exports = {
  insertMessage,
  // getMessage,
  formatMessage,
  getMessages
};
