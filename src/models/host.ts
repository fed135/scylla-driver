/**
 * A single host config
 */

import {createConnection} from './connection';
import { roundRobin } from '../commons/loadBalancing';

export function host(scope, hostname) {
    const streams = Array.from(Array(0xffff >> 1)).fill(null);
    const streamsQueue = [];
    const connections = [spawn()];
    const loadBalancer = roundRobin(connections, scope.options, spawn);

    function getStream() {
        for (let i = 0; i < 0xffff >> 1; i++) {
            if (streams[i] === null) {
                streams[i] = true;
                return i + 1;
            }
        }
        return 0;
    }

    function spawn() {
        const worker = createConnection({
            host: hostname,
            port: scope.options.port,
            options: scope.options,
            cache: scope.localCache,
        });
        worker.on('data', handleResponse);
        worker.on('error', handleError);

        return worker.connect();
    }

    function handleResponse(response) {
        let handle;
        if (response.metadata.streamId < 1 && streamsQueue.length > 0) {
            handle = streamsQueue.shift();
        }
        else {
            handle = streams[response.metadata.streamId - 1];
        }

        if (handle && handle.resolve) {
            handle.resolve(response);
            streams[response.metadata.streamId - 1] = null;
        }
    }

    function handleError(err) {
        console.log('Error in connection worker::', err);
    }

    function execute(op, params) {
        const id = params.streamId || getStream();
        let promise;

        if (id === 0) {
            promise = new Promise((resolve, reject) => {
                streamsQueue.push({ resolve, reject });
            });
        }
        else if (id > 0) {
            promise = new Promise((resolve, reject) => {
                streams[id - 1] = { resolve, reject };
            });
        }

        loadBalancer.getNextConnection().send({
            streamId: id,
            opcode: op,
            body: params,
        });

        return promise;
    }

    return { execute };
}
