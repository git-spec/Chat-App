// ---------------------------------------- setup ----------------------------------------
// import mySql
const mySql = require('mysql');
// import passwords
const {passwordDB} = require('./passwords');

// ---------------------------------------- functions ----------------------------------------
// set global connection variable
let ctn = null;
function connectDB() {
    return new Promise((resolve, reject) => {
        if(ctn) {
            if(ctn.state === "disconnected") {
                ctn.connect(err => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve();
                    };
                });
            } else {
                resolve();
            };
        } else {
            ctn = mySql.createConnection({
                // multipleStatements: true,
                host: 'localhost',
                port: 3306,
                // user: 'phpmyadmin',
                user: 'phpmyadmin',
                password: passwordDB(),
                database: 'chatapp'
            });
            ctn.connect(err => {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                };
            });
        };
    });
};

function runQuery(queryString) {
    return new Promise((resolve, reject) => {
        connectDB().then(() => {
            ctn.query(queryString, (err, result, fields) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                };
            });
        }).catch((err) => {
            reject(err);
        });
    });
};

module.exports = runQuery;
