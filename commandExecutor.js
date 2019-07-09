'use strict';

var exec = require('child_process').exec;

const oneK = 1024;

async function executeAsync(command) {

    return new Promise((resolve, reject) => {
        exec(command, {maxBuffer: oneK * 5000}, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });
};

module.exports.executeAsync = executeAsync;