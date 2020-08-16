/* ************************************************************ SETUP ******************************************************* */
// modules
const passwordHash = require('password-hash');

const runQuery = require('./connection.js');

const users = [];

/* ************************************************************ FUNCTIONS ******************************************************* */
// Register user
function registerUser(firstname, lastname, username, email, password) {
  return new Promise((resolve, reject) => {
    runQuery(`
      INSERT INTO users (firstname, lastname, username, email, password)
      VALUES ('${firstname}', '${lastname}', '${username}', '${email}', '${passwordHash.generate(password)}')
    `).then(() => {
      resolve();
    }).catch(err => {
      if (err.errno === 1062) {
        reject("exists");
      } else {
        reject(err);
      };
    });
  });
};

// Get user for login
function getUser(username, password) {
  return new Promise((resolve, reject) => {
    runQuery(`SELECT * FROM users WHERE users.username LIKE '${username}'`).then(user => {
      if (user.length === 0) {
        // user not found
        reject(3);
      } else {
        if (passwordHash.verify(password, user[0].password)) {
          // password correct
          resolve(user[0]);
        } else {
          // password not correct
          reject(3);
        }
      };
    }).catch(err => {
      // server error
      reject(err); 
    });
  });
};

// connect user with room
function userJoinsRoom(userID, roomID) {
  return new Promise((resolve, reject) => {
    runQuery(`INSERT INTO users_room (userID, roomID) VALUES (${userID}, ${roomID})`).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    });
  });
};

// user leaves room
function userLeavesRoom(userID, roomID) {
  return new Promise((resolve, reject) => {
    // runQuery(`INSERT INTO users_room (userID, roomID) VALUES ('${userID}', '${roomID}')`).then(() => {
    runQuery(`DELETE FROM users_room WHERE roomID=${userID} AND ${roomID}`).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    });
  });
};

// Join user to chat
function userJoin(id, username, room) {
  const user = { id, username, room };
  users.push(user);
  return user;
};

// Get current user
function getCurrentUser(id) {
  return users.find(user => user.id === id);
};

// User leaves chat
function userLeave(id) {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  };
};

// Get room users
function getRoomUsers(room) {
  return users.filter(user => user.room === room);
};

/* ************************************************************ EXPORT ******************************************************* */
module.exports = {
  registerUser,
  getUser,
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  userJoinsRoom
};
