/**
 * Connection worker
 */

/* Requires ------------------------------------------------------------------*/

const net = require('net');
const encoder = require('./encoder');
const decoder = require('./decoder');
const auth = require('./authentication');
const queue = require('./queue');

/* Local variables -----------------------------------------------------------*/

const baseReconnectTime = 100;
const maxRetryAttempts = 10;

/* Methods -------------------------------------------------------------------*/

function collector(scope) {
    console.log('\n\nworker', scope.host);
    const requestQueue = queue(sendDBRequest, { locked: true });
    let reconnectAttempts = 0;
    let authenticator;

    function sendDBRequest(params) {
        console.log('worker sending request', params);
        return scope.connection.socket.write(params);
    }

    function handleDBResponse(payload) {
        const decoded = decoder.request(payload);
        if (decoded.header.opcode === 'result') {
            process.send(decoded);
        }
        else if (auth.authOperations.includes(decoded.header.opcode)) {
            authenticator.step(decoded);
        }
        else if (decoded.header.opcode === 'ready') {
            scope.status = 'ready';
            requestQueue.unlock();
        }
        else {
            handleDBEvent(decoded);
        }
    }

    function handleClientRequest(payload) {
        // console.log('worker got', payload);
        return requestQueue.add(encoder.request(payload));
    }

    function handleDBEvent(payload) {
        console.log(payload);
    }

    function connect(options) {
        scope.status = 'startup';
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

        scope.connection.socket.on('data', handleDBResponse);
        scope.connection.socket.on('error', handleError);
        scope.connection.socket.on('close', handleError);
        process.on('message', handleClientRequest);
        authenticator = auth.sequence(scope, sendDBRequest).begin();

        return scope;
    }

    function handleError(err) {
        console.log(err);

        const delay = baseReconnectTime + (reconnectAttempts * baseReconnectTime) * 1.5;
        reconnectAttempts++;
        if (reconnectAttempts >= maxRetryAttempts) {
            throw new Error(`Maximum reconnect attempts reached for host ${scope.host}`);
        }

        setTimeout(connect, delay);
    }

    return { handleClientRequest, handleDBResponse, sendDBRequest, connect };
}

function init() {
    const scope = collector({
        host: process.argv[2],
        port: process.argv[3],
        compression: process.argv[4],
        cqlVersion: process.argv[5],
        connection: null,
        status: 'startup',
    });

    process.title = 'scylla-worker';
    scope.connect();

    return scope;
}

/* Exports -------------------------------------------------------------------*/

module.exports = init();
