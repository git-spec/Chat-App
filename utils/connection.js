// ---------------------------------------- setup ----------------------------------------
// import mySql
const mySql = require('mysql');

// ---------------------------------------- functions ----------------------------------------
// set global connection variable
let ctn = null;
function connection() {
    return new Promise((resolve, reject) => {
        if(ctn) {
            if(ctn.state === "disconnected") {
                ctn.connect(error => {
                    if(error) {
                        reject(error);
                    } else {
                        resolve();
                    };
                });
            } else {
                resolve();
            };
        } else {
            ctn = mySql.createConnection({
                multipleStatements: true,
                host: 'localhost',
                port: 3306,
                user: 'admin',
                password: '12345678',
                database: 'chat'
            });
            ctn.connect(error => {
                if(error) {
                    reject(error);
                } else {
                    resolve();
                };
            });
        };
    });
};

function runQuery(queryString) {
    return new Promise((resolve, reject) => {
        connection().then(() => {
            ctn.query(queryString, (error, result, fields) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                };
            });
        }).catch((error) => {
            reject(error);
        });
    });
};