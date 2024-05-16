export function roundRobin(list, options, createConnection) {
    let roundRobinIndex = 0;

    function getNextConnection() {
        let connection = list[roundRobinIndex];
        if (connection && connection.queueLength() > 0) {
            if (list.length < options.connections.local) {
                connection = createConnection();
                list.push(connection);
            }
        }

        roundRobinIndex++;
        
        if (roundRobinIndex >= list.length) roundRobinIndex = 0;
        return connection;
    }

    return { getNextConnection };
}
