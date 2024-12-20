/**
 * Connection worker
 */

import {connect as connectSocket} from 'net';
import {query, prepare, execute, request as encodeRequest} from '../commons/encoder';
import {int32} from '../commons/decoder';
import {streamDecode, verifyPayload} from '../commons/stream';
import {routines as Routines} from '../commons/ecs';
import {authentication} from '../routines/authentication';
import {queue} from '../commons/queue';
import {EventEmitter} from 'node:events';
import { toUTF8StringRange } from '../commons/dataStructures';

export function createConnection(options) {
    return connection(options, new EventEmitter());
}

export function connection(options, emitter) {
    let requestQueue = queue(sendDBRequest, { locked: true });
    let socket = null;
    let status = 'startup';
    let reconnectAttempts = 0;
    let routines;

    function sendDBRequest(params) {
        return socket.write(params);
    }

    function handleDBResponse(startingBytes) {
        let frame = startingBytes ? [...startingBytes] : [...socket.read(9)]; // Read header by default
        let totalSize = int32([frame[5], frame[6], frame[7], frame[8]]);
        let processedBytes = 9;
        let data;

        if (!verifyPayload(frame, options)) {
            while ((data = socket.read()) !== null) {
                frame.push.apply(frame, data);
            }

            console.log('Junk in the pipe:', Buffer.from(frame).toString());

            return;
        }

        if (totalSize > 0) {
            let data = socket.read(totalSize);
            frame.push.apply(frame, data);
            processedBytes += totalSize;
        }
       
        routeDBResponse(frame);

        const moreData = socket.read();
        if (moreData) return handleDBResponse(moreData);
    }

    function routeDBResponse(payload) {
        const decodedHeader = streamDecode(payload, options);

        emitter.emit('frame', { header: decodedHeader, rawFrame: payload });

        if (decodedHeader.metadata.opcode === 'result') {
            emitter.emit('data', decodedHeader);
        }
        else if (['ready', 'authSuccess'].includes(decodedHeader.metadata.opcode)) {
            console.log('connection ready!');
            status = 'ready';
            emitter.emit('ready');
            requestQueue.unlock();
        }
        else if (decodedHeader.metadata.opcode === 'error') {
            console.log('Error:', decodedHeader);
        }
        else {
            handleDBEvent(decodedHeader);
        }
    }

    function send(payload, skipEncoding = false, skipQueue = false) { // TODO: cleanup

        if (!skipEncoding) {
            switch(payload.opcode) {
                case 'query': 
                    payload.body = query(payload.body, options);
                    break;
                case 'prepare': 
                    payload.body = prepare(payload.body);
                    break;
                case 'execute':
                    payload.body = execute(payload.body, options);
                    break;
                default:
                    console.warn('opcode not found ', payload.opcode);
                    return;
            }
        }

        if (skipQueue) return sendDBRequest(encodeRequest(payload));
        return requestQueue.add(encodeRequest(payload));
    }

    function handleDBEvent(payload) {
        console.log('what is this?', payload);
    }

    function connect() {
        status = 'startup';

        let [host, port] = options.host.split(':');
        if (host === '0.0.0.0') host = '127.0.0.1'; // Hotfix for localhost in newer Node versions

        if (options.host[0] !== '/') socket = connectSocket(parseInt(port) || options.port, host);
        else socket = connectSocket(host);

        socket.on('connect', handleConnection);
        socket.on('readable', handleDBResponse);
        socket.on('error', handleError);
        socket.on('close', handleClose);

        return instance;
    }

    function handleConnection() {
        reconnectAttempts = 0;
        status = 'connected';
        emitter.emit('connect');
        console.log('connected!')
    }

    function handleError(err) {
        console.log(err);
    }

    function handleClose() {
        if (status !== 'closing') {

            const delay = options.options.baseReconnectTimeMs + (reconnectAttempts * options.options.baseReconnectTimeMs) * 1.5;
            reconnectAttempts++;

            console.log('connection attempt', reconnectAttempts, '/', options.options.maxRetryAttempts)
            if (reconnectAttempts >= options.options.maxRetryAttempts) {
                throw new Error(`Unable to connect with host ${options.host}`);
            }

            setTimeout(connect, delay);
        }
    }

    function close() {
        status = 'closing';
        routines.terminate();
    }

    const instance = Object.assign(emitter, { send, connect, close, queueLength: requestQueue.size });

    routines = Routines(instance, [
        authentication,
        // Reconnection
    ]);

    return instance;
}
