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
function leaveUsersRoom(userID) {
  return new Promise((resolve, reject) => {
    runQuery(`DELETE FROM users_room WHERE userID=${userID}`).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    });
  });
};

// login user
function getRoomUsers(room) {
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

// const users = [];
// // join user to chat
// function userJoin(id, username, room) {
//   const user = { id, username, room };
//   users.push(user);
//   return user;
// };

// // get current user
// function getCurrentUser(id) {
//   return users.find(user => user.id === id);
// };

// // user leaves chat
// function userLeave(id) {
//   const index = users.findIndex(user => user.id === id);
//   if (index !== -1) {
//     return users.splice(index, 1)[0];
//   };
// };

// // get room users
// function getRoomUsers(room) {
//   return users.filter(user => user.room === room);
// };

/* ************************************************************ EXPORT ******************************************************* */
module.exports = {
  registerUser,
  loginUser,
  joinUsersRoom,
  leaveUsersRoom,
  getRoomUsers
};
