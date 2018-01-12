/**
 * The list of hosts
 */

/* Requires ------------------------------------------------------------------*/

const host = require('./host');

/* Methods -------------------------------------------------------------------*/

function hosts(scope) {
    const list = scope.options.hosts.map(host.bind(null, scope));
    let roundRobinIndex = 0;

    function addHost() {

    }

    function removeHost() {

    }

    function select() {
        const hostname = list[roundRobinIndex];
        roundRobinIndex++;
        
        if (roundRobinIndex >= list.length) roundRobinIndex = 0;
        return hostname;
    }

    function topology() {
        // Should be returned by the service
        // return JSON.parse(JSON.stringify(list));
    }

    return { addHost, removeHost, select, topology };
}

/* Exports -------------------------------------------------------------------*/

module.exports = hosts;