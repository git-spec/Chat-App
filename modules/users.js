/* ************************************************************ SETUP ******************************************************* */
// modules
const passwordHash = require('password-hash');
const runQuery = require('./connection.js');
const emailSender = require('./emailSender')

/* ************************************************************ FUNCTIONS ******************************************************* */
// register user
function registerUser(firstname, lastname, username, email, password) {
  return new Promise((resolve, reject) => {
    runQuery(`
      INSERT INTO users (firstname, lastname, username, email, password)
      VALUES ('${firstname}', '${lastname}', '${username}', '${email}', '${passwordHash.generate(password)}')
    `).then(() => {
      // email message
      let message = `Hello ${firstname} ${lastname},\nWelcome to our website!\n
                    To verify your email address please click on the following link:\n
                    http://localhost:3000/verify/${newUser._id}`;                // https://ingo-emailverfication.coding-school.org/verify/${newUser._id}
      emailSender.sendEmail(email, 'Verify Email', message).then(() => {
          resolve()
      }).catch(error => {
          reject(error)
      })
    }).catch(err => {
      if (err.errno === 1062) {
        reject("exists");
      } else {
        reject(err);
      };
    });
  });
};

// verify user
function verifyUser(userID) {
  return new Promise((resolve, reject) => {
    runQuery(`UPDATE users SET users.verified = TRUE WHERE users.ID = '${userID}'`).then((result) => {
console.log(result);
      resolve(result);
    }).catch(err => {
      reject(err);
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
        // password correct or not
        if (passwordHash.verify(password, user[0].password)) {
          // verified or not
console.log('verified', user[0].verified);
          if (user[0].verified == 1) {
            resolve(user[0]);
          } else {
            reject(6);
          };
        } else {
          // password not correct
          reject(3);
        };
      };
    }).catch(err => {
      // server error
      reject(err); 
    });
  });
};

// connect user with room
function joinUsersRoom(userID, roomID, socketID) {
  return new Promise((resolve, reject) => {
    runQuery(`INSERT INTO users_room (userID, roomID, socketID) VALUES (${userID}, ${roomID}, '${socketID}')`).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    });
  });
};

// user leaves room
function leaveUsersRoom(socketID) {
  return new Promise((resolve, reject) => {
    runQuery(`DELETE FROM users_room WHERE socketID='${socketID}'`).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    });
  });
};

// get users from a specific room
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
  getUsersRoom,
  verifyUser
};
