
const crypto = require('crypto');

const content = 'user:evanxsummers' + Math.random();
const startTimestamp = Date.now();
const sha = crypto.createHash('sha1').update(content).digest('base64');
const duration = Date.now() - startTimestamp;
console.log({duration, sha}, startTimestamp);
