const runQuery = require("./connection");

function getRooms(){
    return new Promise((resolve, reject) => {
        runQuery('SELECT * FROM rooms ORDER BY ID').then(data => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
};

function getRoom(room){
    return new Promise((resolve, reject) => {
        runQuery(`SELECT * FROM rooms WHERE rooms.room = '${room}'`).then(data => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
};

function getRoomAndUser(socketID){
    return new Promise((resolve, reject) => {
        runQuery(`
                SELECT rooms.room, users.username FROM rooms
                INNER JOIN users_room ON rooms.ID = users_room.roomID
                INNER JOIN users ON users_room.userID = users.ID
                WHERE users_room.socketID = '${socketID}'
        `).then(data => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
};

function createRoom(room) {
    return new Promise((resolve, reject) => {
        runQuery(`INSERT INTO rooms (room) VALUES ('${room}')`).then(() => {
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

module.exports = {
    getRooms,
    getRoom,
    getRoomAndUser,
    createRoom
};