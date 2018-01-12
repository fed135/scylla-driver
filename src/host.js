/**
 * The list of hosts
 */

/* Requires ------------------------------------------------------------------*/

const path = require('path');
const fork = require('child_process').fork;

/* Methods -------------------------------------------------------------------*/

function host(scope, hostname) {
    let roundRobinIndex = 0;
    const connections = Array.from(Array(scope.options.workers)).map(spawn);
    
    const streams = Array.from(Array(0xffff >> 1));
    const streamsQueue = [];

    function getConnection() {
        const connection = connections[roundRobinIndex];
        roundRobinIndex++;
        
        if (roundRobinIndex >= connections.length) roundRobinIndex = 0;
        return connection;
    }

    function getStream() {
        for (let i = 0; i < 0xffff >> 1; i++) {
            if (!streams[i]) {
                streams[i] = true;
                return i + 1;
            }
        }
        return 0;
    }

    function spawn() {
        const connection = {
            worker: fork(path.resolve(__dirname, 'worker'), [
                hostname,
                scope.options.port
            ]),
        };
        connection.worker.on('message', handleResponse);
        connection.worker.on('error', handleError);

        return connection;
    }

    function handleResponse(response) {
        console.log('host got', response)
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

        getConnection().worker.send({
            id,
            op,
            params,
        });

        return promise;
    }

    return { execute };
}

/* Exports -------------------------------------------------------------------*/

module.exports = host;