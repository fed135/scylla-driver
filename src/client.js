/*
 * Client methods
 */

/* Requires ------------------------------------------------------------------*/

const defaults = require('./defaults');
const hosts = require('./hosts');

/* Methods -------------------------------------------------------------------*/

function client(scope, hosts) {
    let loadBalancerIndex = 0;

    function execute(statement, vars, options) {
        if (options === undefined) {
            options = vars || {};
            vars = [];
        }
        return hosts.select().execute('query', {
            statement,
            vars,
            options: Object.assign({}, scope.options.queryOptions, options)
        });
    }

    function stream() {

    }

    function destroy() {

    }

    function init() {
        console.log(scope)

        // Returns a clean interface
        return { execute, stream, destroy };
    }

    // Exposes internals for unit testing
    return { execute, stream, destroy, init };
}

function create(options) {
    const scope = {
        options: Object.assign({}, defaults, options)
    };

    return client(scope, hosts(scope));
}

/* Exports -------------------------------------------------------------------*/

module.exports = create;