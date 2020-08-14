const runQuery = require("./connection");

function getRooms(){
    return new Promise((resolve, reject) => {
        runQuery('SELECT * FROM rooms').then(rooms => {
            resolve(rooms);
        }).catch(err => {
            reject(err);
        });
    });
};

module.exports = {
    getRooms
};