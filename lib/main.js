
const assert = require('assert');
const crypto = require('crypto');
const zlib = require('zlib');
const lodash = require('lodash');
const Promise = require('bluebird');
const multiExecAsync = require('multi-exec-async');
const pathFormat = require('./pathFormat');

function removeAsync(store, key) {
    return new Promise((resolve, reject) => {
        store.remove({key},
            (err, result) => err ? reject(err) : resolve(result)
        );
    });
}

function writeAsync(store, key, data) {
    return new Promise((resolve, reject) => {
        const stream = store.createWriteStream({key},
            (err, result) => err ? reject(err) : resolve(result)
        );
        stream.write(data);
        stream.end();
    });
}

function gzipAsync(data) {
    return new Promise((resolve, reject) => {
        zlib.gzip(data,
            (err, result) => err ? reject(err) : resolve(result)
        );
    });
}

module.exports = async context => {
    const {config, logger, client} = context;
    Object.assign(global, context);
    const blobStore = require(config.blobStoreType)(config.blobStore);
    if (false) {
        const [snapshot] = await multiExecAsync(client, multi => {
            multi.hget('refile:h', 'snapshot');
        });
    }
    while (true) {
        const key = await client.brpoplpushAsync('refile:key:q', 'refile:busy:key:q', 10);
        if (!key) {
            logger.info('empty');
            if (config.exit === 'empty') {
                logger.warn('exit on empty');
                break;
            }
            continue;
        }
        logger.some('popped', key);
        if (key === 'exit') {
            await client.lremAsync('refile:busy:key:q', 1, key);
            break;
        }
        try {
            const timestamp = Date.now();
            const keyPath = pathFormat.keyPath(key);
            const [modtimeString, psha] = await multiExecAsync(client, multi => {
                multi.hget(`refile:modtime:h`, key);
                multi.hget(`refile:sha:h`, key);
                multi.hincrby(`refile:metrics:h`, 'popped', 1);
            });
            const content = await client.getAsync(key);
            if (!content) {
                logger.debug('remove', keyPath);
                await removeAsync(blobStore, keyPath);
                if (!psha) {
                    await multiExecAsync(client, multi => {
                        multi.hincrby(`refile:metrics:h`, 'nonexistent', 1);
                        multi.lrem('refile:busy:key:q', 1, key);
                    });
                    continue;
                } else if (modtimeString) {
                    const modtime = parseInt(modtimeString);
                    if (modtime >= timestamp) {
                        timestamp = modtime + 1;
                    }
                }
                await multiExecAsync(client, multi => {
                    multi.hincrby(`refile:metrics:h`, 'deleted', 1);
                    multi.hset(`refile:modtime:h`, key, timestamp);
                    multi.hdel(`refile:sha:h`, key);
                    if (config.mode === 'snapshot') {
                        multi.hdel(`refile:${config.snapshot}:sha:h`, key);
                        multi.zadd(`refile:${config.snapshot}:key:${key}:z`, timestamp, timestamp);
                    }
                    multi.lrem('refile:busy:key:q', 1, key);
                    if (config.outq) {
                        multi.lpush(config.outq, key);
                    }
                });
            } else {
                const sha = crypto.createHash('sha1').update(content).digest('hex');
                logger.some('remove', key, sha, psha);
                if (sha === psha && false) {
                    await multiExecAsync(client, multi => {
                        multi.hincrby(`refile:metrics:h`, 'unchanged', 1);
                        multi.lrem('refile:busy:key:q', 1, key);
                    });
                    continue;
                }
                if (modtimeString) {
                    const modtime = parseInt(modtimeString);
                    if (modtime >= timestamp) {
                        timestamp = modtime + 1;
                    }
                }
                const timestampPath = pathFormat.timestampPath(key, new Date(timestamp));
                const shaPath = pathFormat.shaPath(key, sha);
                logger.debug({keyPath, shaPath, timestampPath, sha, timestamp}, JSON.parse(content));
                const gzipped = await gzipAsync(content);
                await writeAsync(blobStore, keyPath, gzipped);
                if (config.mode === 'snapshot') {
                    await writeAsync(blobStore, timestampPath, gzipped);
                    await writeAsync(blobStore, shaPath, gzipped);
                }
                await multiExecAsync(client, multi => {
                    multi.hincrby(`refile:metrics:h`, 'export', 1);
                    multi.hset(`refile:modtime:h`, key, timestamp);
                    multi.hset(`refile:sha:h`, key, sha);
                    if (config.mode === 'snapshot') {
                        multi.hset(`refile:${config.snapshot}:sha:h`, key, sha);
                        multi.zadd(`refile:${config.snapshot}:key:${key}:z`, timestamp, sha);
                    }
                    multi.lrem('refile:busy:key:q', 1, key);
                    if (config.outq) {
                        multi.lpush(config.outq, key);
                    } else if (config.expire) {
                        multi.expire(key, config.expire);
                    } else if (config.action === 'delete'){
                        multi.del(key);
                    }
                });
            }
        } catch (err) {
            if (err.name === 'DataError') {
                console.error(err.message, err.data);
            } else {
                console.error(err);
            }
        } finally {
        }
    }
    logger.info('exiting');
};
