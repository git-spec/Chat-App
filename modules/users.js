/* ************************************************************ SETUP ******************************************************* */
// modules
const passwordHash = require('password-hash');
const runQuery = require('./connection.js');

/* ************************************************************ FUNCTIONS ******************************************************* */
// register user
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

// login user
function loginUser(username, password) {
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
function joinUsersRoom(userID, roomID) {
  return new Promise((resolve, reject) => {
    runQuery(`INSERT INTO users_room (userID, roomID) VALUES (${userID}, ${roomID})`).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    });
  });
};

// user leaves room
function leaveUsersRoom(userID, roomID) {
  return new Promise((resolve, reject) => {
    runQuery(`DELETE FROM users_room WHERE userID=${userID} AND roomID=${roomID}`).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    });
  });
};

// 
function getUsersRoom(room) {
  return new Promise((resolve, reject) => {
    runQuery(`
              SELECT users.* FROM users 
              INNER JOIN users_room ON users.ID = users_room.userID
              INNER JOIN rooms ON users_room.roomID = rooms.ID
              WHERE rooms.room = '${room}'
    `).then(users => {
      resolve(users);
    }).catch(err => {
      reject(err); 
    });
  });
};

/* ************************************************************ EXPORT ******************************************************* */
module.exports = {
  registerUser,
  loginUser,
  joinUsersRoom,
  leaveUsersRoom,
  getUsersRoom
};
