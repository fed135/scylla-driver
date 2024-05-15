/**
 * Connection worker
 */

import {connect as connectSocket} from 'net';
import {query, prepare, execute, request as encodeRequest} from '../commons/encoder';
import {int32, request as decodeRequest} from '../commons/decoder';
import {authOperations, sequence} from '../components/authentication';
import {queue} from '../commons/queue';
import {EventEmitter} from 'node:events';

export function createConnection(options) {
    const scope = {
        socket: null,
        status: 'startup',
        requestQueue: null,
        reconnectAttempts: 0,
        authenticator: null,
    };

    return Object.assign(scope, options, connection(scope), EventEmitter.prototype);
}

export function connection(scope) {
    scope.requestQueue = queue(sendDBRequest, { locked: true });

    function sendDBRequest(params) {
        // console.log('worker sending request', params);
        return scope.socket.write(params);
    }

    function handleDBResponse(payload) {
        let caret = 0;
        while (caret < payload.length) {
            const frameSize = 9 + int32(payload.slice(caret + 5, caret + 9));
            routeDBResponse(payload.slice(caret, caret + frameSize));
            caret += frameSize;
        }
    }

    function routeDBResponse(payload) {
        const decoded = decodeRequest(payload);
        if (decoded.header.opcode === 'result') {
            scope.emit('data', decoded);
        }
        else if (authOperations.includes(decoded.header.opcode)) {
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
                payload.body = query(payload.body, scope);
                break;
            case 'prepare': 
                payload.body = prepare(payload.body);
                break;
            case 'execute':
                payload.body = execute(payload.body, scope);
                break;
            default:
                console.warn('opcode not found ', payload.opcode);
                return;
        }
        return scope.requestQueue.add(encodeRequest(payload));
    }

    function handleDBEvent(payload) {
        console.log(payload);
    }

    function connect(options) {
        scope.status = 'startup';
        if (scope.host[0] !== '/') scope.socket = connectSocket(scope.port, scope.host);
        else scope.socket = connectSocket(scope.host);

        scope.socket.on('connect', handleConnection);
        scope.socket.on('data', handleDBResponse);
        scope.socket.on('error', handleError);
        scope.socket.on('close', handleError);
        scope.authenticator = sequence(scope, sendDBRequest).begin();

        return scope;
    }

    function handleConnection() {
        scope.reconnectAttempts = 0;
        scope.status = 'connected';
    }

    function handleError(err) {
        console.log(err);

        const delay = scope.baseReconnectTime + (scope.reconnectAttempts * scope.baseReconnectTime) * 1.5;
        scope.reconnectAttempts++;
        if (scope.reconnectAttempts >= scope.maxRetryAttempts) {
            throw new Error(`Maximum reconnect attempts reached for host ${scope.host}`);
        }

        setTimeout(connect, delay);
    }

    return { send, connect };
}
