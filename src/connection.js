/**
 * Connection worker
 */

/* Requires ------------------------------------------------------------------*/

const net = require('net');
const encoder = require('./encoder');
const decoder = require('./decoder');
const auth = require('./authentication');
const queue = require('./queue');
const EventEmitter = require('events').EventEmitter;

/* Local variables -----------------------------------------------------------*/

const baseReconnectTime = 100;
const maxRetryAttempts = 10;

/* Methods -------------------------------------------------------------------*/

function createConnection(options) {
    const scope = {
        socket: null,
        status: 'startup',
        requestQueue: null,
        reconnectAttempts: 0,
        authenticator: null,
    };

    return Object.assign(scope, options, connection(scope), EventEmitter.prototype);
}

function connection(scope) {
    scope.requestQueue = queue(sendDBRequest, { locked: true });

    function sendDBRequest(params) {
        // console.log('worker sending request', params);
        return scope.socket.write(params);
    }

    function handleDBResponse(payload) {
        let caret = 0;
        while (caret < payload.length) {
            const frameSize = 9 + decoder.int32(payload.slice(caret + 5, caret + 9));
            routeDBResponse(payload.slice(caret, caret + frameSize));
            caret += frameSize;
        }
    }

    function routeDBResponse(payload) {
        const decoded = decoder.request(payload);
        if (decoded.header.opcode === 'result') {
            scope.emit('data', decoded);
        }
        else if (auth.authOperations.includes(decoded.header.opcode)) {
            scope.authenticator.step(decoded);
        }
        else if (decoded.header.opcode === 'ready') {
            scope.status = 'ready';
            scope.requestQueue.unlock();
        }
        else {
            handleDBEvent(decoded);
        }
    }

    function send(payload) {
        switch(payload.opcode) {
            case 'query': 
                payload.body = encoder.query(payload.body);
                break;
            case 'prepare': 
                payload.body = encoder.prepare(payload.body);
                break;
            case 'execute':
                payload.body = encoder.execute(payload.body);
                break;
            default:
                console.warn('opcode not found ', opcode);
                return;
        }
        return scope.requestQueue.add(encoder.request(payload));
    }

    function handleDBEvent(payload) {
        console.log(payload);
    }

    function connect(options) {
        scope.status = 'startup';
        if (scope.host[0] !== '/') scope.socket = net.connect(scope.port, scope.host);
        else scope.socket = net.connect(scope.host);

        scope.socket.on('data', handleDBResponse);
        scope.socket.on('error', handleError);
        scope.socket.on('close', handleError);
        scope.authenticator = auth.sequence(scope, sendDBRequest).begin();

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

    return { send, connect };
}

/* Exports -------------------------------------------------------------------*/

module.exports = createConnection;
