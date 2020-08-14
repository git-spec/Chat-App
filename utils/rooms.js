const runQuery = require("./connection");

function getRooms(){
    return new Promise((resolve, reject) => {
        runQuery('SELECT * FROM rooms ORDER BY ID').then(rooms => {
            resolve(rooms);
        }).catch(err => {
            reject(err);
        });
    });
};

module.exports = {
    getRooms
};