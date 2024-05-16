/**
 * Connection worker
 */

import {connect as connectSocket} from 'net';
import {query, prepare, execute, request as encodeRequest} from '../commons/encoder';
import {int32} from '../commons/decoder';
import {streamDecode} from '../commons/stream';
import {authOperations, sequence} from '../components/authentication';
import {queue} from '../commons/queue';
import {EventEmitter} from 'node:events';

export function createConnection(scope) {
    return connection({
        socket: null,
        status: 'startup',
        requestQueue: null,
        reconnectAttempts: 0,
        authenticator: null,
        ...scope,
    }, new EventEmitter());
}

export function connection(scope, emitter) {
    scope.requestQueue = queue(sendDBRequest, { locked: true });

    function sendDBRequest(params) {
        return scope.socket.write(params);
    }

    function handleDBResponse(payload) {
        // Split frames
        let caret = 0;
        while (caret < payload.length) {
            const frameSize = 9 + int32(payload.slice(caret + 5, caret + 9));
            routeDBResponse(payload.slice(caret, caret + frameSize));
            caret += frameSize;
        }
    }

    function routeDBResponse(payload) {
        const decoded = streamDecode([...payload], scope);

        if (decoded.metadata.opcode === 'result') {
            //emitter.emit('data', { header: decoded.header, body: parseResult(decoded.body, scope) });
            emitter.emit('data', decoded);
        }
        else if (authOperations.includes(decoded.metadata.opcode)) {
            scope.authenticator.step(decoded);
        }
        else if (decoded.metadata.opcode === 'ready') {
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
        console.log('what is this?', payload);
    }

    function connect(options) {
        scope.status = 'startup';

        let [host, port] = scope.host.split(':');
        if (host === '0.0.0.0') host = '127.0.0.1'; // Hotfix for localhost in newer Node versions

        if (scope.host[0] !== '/') scope.socket = connectSocket(parseInt(port) || scope.port, host);
        else scope.socket = connectSocket(host);

        scope.socket.on('connect', handleConnection);
        scope.socket.on('data', handleDBResponse);
        scope.socket.on('error', handleError);
        scope.socket.on('close', handleClose);
        scope.authenticator = sequence(scope, sendDBRequest).begin();

        return instance;
    }

    function handleConnection() {
        scope.reconnectAttempts = 0;
        scope.status = 'connected';
    }

    function handleError(err) {
        console.log(err);
    }

    function handleClose() {
        if (scope.status !== 'closing') {

            const delay = scope.options.baseReconnectTimeMs + (scope.reconnectAttempts * scope.options.baseReconnectTimeMs) * 1.5;
            scope.reconnectAttempts++;

            console.log('connection attempt', scope.reconnectAttempts, '/', scope.options.maxRetryAttempts)
            if (scope.reconnectAttempts >= scope.options.maxRetryAttempts) {
                throw new Error(`Unable to connect with host ${scope.host}`);
            }

            setTimeout(connect, delay);
        }
    }

    function close() {
        scope.status = 'closing';
    }

    const instance = Object.assign(emitter, { send, connect, close, queueLength: scope.requestQueue.size });

    return instance;
}
