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

function getRoomByUserID(userID){
    return new Promise((resolve, reject) => {
        runQuery(`
                SELECT rooms.* FROM rooms
                INNER JOIN users_room ON rooms.ID = users_room.roomID
                WHERE users_room.userID = ${userID}
        `).then(data => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
};

function createRoom(newRoom) {
    return new Promise((resolve, reject) => {
        runQuery(`INSERT INTO rooms (room) VALUES ('${newRoom}')`).then(data => {
            resolve(data);
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
    getRoomByUserID,
    createRoom
};