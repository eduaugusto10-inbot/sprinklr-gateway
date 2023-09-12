const fs = require('fs');
// import fs from 'fs';

const version = {};

fs.readFile('VERSION', 'utf8', function (err, data) {
    if (err) {
        throw err;
    }
    version.num = data;
    console.log(`Version: ${ version.num }`);
});

module.exports = version;
