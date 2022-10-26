/**
 * A single host config
 */

/* Requires ------------------------------------------------------------------*/

const connection = require('./connection');

/* Methods -------------------------------------------------------------------*/

function host(scope, hostname) {
    let roundRobinIndex = 0;
    const streams = Array.from(Array(0xffff >> 1)).fill(null);
    const streamsQueue = [];
    const connections = Array.from(Array(scope.options.connections.local))
        .map(spawn);

    function getConnection() {
        const connection = connections[roundRobinIndex];
        roundRobinIndex++;
        
        if (roundRobinIndex >= connections.length) roundRobinIndex = 0;
        return connection;
    }

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
        const worker = connection({
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
        if (response.header.streamId < 1 && streamsQueue.length > 0) {
            handle = streamsQueue.shift();
        }
        else {
            handle = streams[response.header.streamId - 1];
        }

        if (handle && handle.resolve) {
            handle.resolve(response.body);
            streams[response.header.streamId - 1] = null;
        }
    }

    function handleError(err) {
        console.log('Error in connection worker::', err);
    }

    function execute(op, params) {
        const id = params.streamId || getStream();
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

        getConnection().send({
            streamId: id,
            opcode: op,
            body: params,
        });

        return promise;
    }

    return { execute };
}

/* Exports -------------------------------------------------------------------*/

module.exports = host;