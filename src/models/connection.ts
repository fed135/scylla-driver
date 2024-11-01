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
import { toUTF8StringRange } from '../commons/dataStructures';

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

    function handleDBResponse() {
        let frame = [...scope.socket.read(9)]; // Read header by default
        let totalSize = int32([frame[5], frame[6], frame[7], frame[8]]);
        let processedBytes = 9;
        let data;
        
        while ((data = scope.socket.read(totalSize)) !== null) {
            console.log('reading data')
            frame.push.apply(frame, data);
            processedBytes += totalSize;
        }
        
        console.log('got fresh payload: ', frame.length, 'expecting total bytes:', totalSize)

        // TODO: Do we need to split frames?
        routeDBResponse(frame);
    }

    function routeDBResponse(payload) {
        const decoded = streamDecode([...payload], scope);
        console.log(decoded, toUTF8StringRange(payload, payload.length - decoded.metadata.bodyLength, decoded.metadata.bodyLength))

        if (decoded.metadata.opcode === 'result') {
            //emitter.emit('data', { header: decoded.header, body: parseResult(decoded.body, scope) });
            emitter.emit('data', decoded);
        }
        else if (authOperations.includes(decoded.metadata.opcode)) {
            scope.authenticator.step(decoded, toUTF8StringRange(payload, payload.length - decoded.metadata.bodyLength, decoded.metadata.bodyLength));
        }
        else if (decoded.metadata.opcode === 'ready' || decoded.metadata.opcode === 'authSuccess') {
            scope.status = 'ready';
            scope.requestQueue.unlock();
        }
        else if (decoded.metadata.opcode === 'error') {
            console.log('Error:', decoded, toUTF8StringRange(payload, payload.length - decoded.metadata.bodyLength, decoded.metadata.bodyLength))
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
        scope.socket.on('readable', handleDBResponse);
        scope.socket.on('error', handleError);
        scope.socket.on('close', handleClose);
        scope.authenticator = sequence(scope, sendDBRequest);
        scope.authenticator.begin();

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
