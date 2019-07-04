'use strict';

const request = require('superagent');
const fs      = require('fs');

async function getAsync(target) {

    // We'll just assume its a url
    return new Promise((accept, reject) => {
        request.get(target.trim(), (err, response) => {
            if (err) {
                reject(err);
            } else {
                accept(response.body);
            }
        });
    });
}

module.exports.getAsync = getAsync;