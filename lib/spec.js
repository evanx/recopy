module.exports = pkg => ({
    name: pkg.lastName,
    description: pkg.description,
    env: {
        host: {
            description: 'the Redis host',
            default: 'localhost'
        },
        port: {
            description: 'the Redis port',
            default: 6333
        },
        namespace: {
            description: 'the Redis namespace',
            default: pkg.lastName
        },
        httpLocation: {
            description: 'the HTTP location',
            default: '/re'
        }
    },
    config: env => ({
        httpPort: {
            description: 'the HTTP port',
            default: 8031
        },
        inq: {
            description: 'the queue to import',
            default: `${env.namespace}:in:q`
        },
        outq: {
            description: 'the output key queue',
            default: `${env.namespace}:out:q`
        },
        busyq: {
            description: 'the pending list for brpoplpush',
            default: `${env.namespace}:busy:q`
        },
        popTimeout: {
            description: 'the timeout for brpoplpush',
            unit: 'seconds',
            default: 10
        },
        loggerLevel: {
            description: 'the logging level',
            defaults: {
                production: 'info',
                test: 'info',
                development: 'debug'
            }
        }
    }
});
