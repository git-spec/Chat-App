/* ************************************************************ SETUP ******************************************************* */
// modules
const passwordHash = require('password-hash');

const runQuery = require('./connection.js');

const users = [];

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
      }
    })
  })
}

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
  }
};

// Get room users
function getRoomUsers(room) {
  return users.filter(user => user.room === room);
};

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  registerUser
};
