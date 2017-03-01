
const crypto = require('crypto');
const lodash = require('lodash');

const key = key => key.replace(/\W/g, '-')

const keyPath = key => {
    const sha = crypto.createHash('sha1').update(key).digest('hex');
    return [
        'key',
        sha.substring(0, 3),
        [
            key.replace(/\W(json|j)$/, '').replace(/\W/g, '-'),
            'json',
            'gz'
        ].join('.')
    ].join('/');
};

const shaPath = (key, sha) => {
    return [
        'sha',
        sha.substring(0, 3),
        [
            sha,
            key.replace(/\W(json|j)$/, '').replace(/\W/g, '-'),
            'json',
            'gz'
        ].join('.')
    ].join('/');
};

const timestampPath = (key, date) => {
    const dateString = date.toISOString();
    return [
        'time',
        dateString.substring(0, 10),
        dateString.substring(11, 19).replace(/:/, 'h').replace(/:/, 'm'),
        [
            dateString.substring(20, 23),
            key.replace(/\W(json|j)$/, '').replace(/\W/g, '-'),
            'json',
            'gz'
        ].join('.')
    ].join('/');
};

module.exports = {key, keyPath, timestampPath, shaPath}
