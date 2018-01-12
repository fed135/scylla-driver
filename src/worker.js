/**
 * Connection worker
 */

/* Requires ------------------------------------------------------------------*/

const net = require('net');
const encoder = require('./encoder');
const decoder = require('./decoder');

/* Methods -------------------------------------------------------------------*/

function collector(scope) {
    console.log('\n\nworker', scope);

    function sendDBRequest(params) {
        // Dummy
        return handleDBResponse({ rows: [ { foo: 'bar' }]});
        // Real
        // return scope.connection.socket.write(params);
    }

    function handleDBResponse(body) {
        // Dummy
        return Promise.resolve({
            header: { streamId: -1 },
            body,
        });
    }

    function handleClientRequest(payload) {
        console.log('worker got', payload);
        return sendDBRequest(payload.params)
            .then(sendClientResponse);
    }

    function sendClientResponse(payload) {
        process.send(payload);
    }

    function connect(options) {
        if (scope.host[0] !== '/') {
            scope.connection = {
                type: 'tcp',
                socket: net.connect(scope.port, scope.host)
            };
        } else {
            scope.connection = {
                type: 'ipc',
                socket: net.connect(scope.host)
            };
        }

        scope.connection.socket.on('message', handleDBResponse);
        scope.connection.socket.on('error', err => { /*throw err;*/ });
        process.on('message', handleClientRequest);

        return scope;
    }

    function query(params) {
        return sendDBRequest
    }

    return { query, connect };
}

function init() {
    const scope = collector({
        host: process.argv[2],
        port: process.argv[3],
        queue: [],
        connection: null,
        status: 'startup',
    });

    process.title = 'scylla-worker';
    scope.connect();

    return scope;
}

/* Exports -------------------------------------------------------------------*/

module.exports = init();
