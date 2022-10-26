/*
 * Client methods
 */

/* Requires ------------------------------------------------------------------*/

const defaults = require('./defaults');
const hosts = require('./hosts');

/* Methods -------------------------------------------------------------------*/

function client(scope, hostList) {

    function query(statement, vars, options) {
        if (options === undefined) {
            options = vars || {};
            vars = [];
        }

        const finalQueryOptions = Object.assign({}, scope.options.queryOptions, options);

        if (finalQueryOptions.prepare === true) {
            if (!(statement in localCache.localPreparedStatements)) {
                return prepare(statement).then((preparedId) => {
                    localCache.localPreparedStatements[statement] = preparedId;

                    return execute(statement, vars, finalQueryOptions);
                });
            }
            return execute(statement, vars, finalQueryOptions);
        }

        return hostList.select().execute('query', {
            statement,
            vars,
            options: finalQueryOptions,
        });
    }

    function execute(statement, vars, options) {
        return hostList.select().execute('execute', {
            preparedId: localCache.localPreparedStatements[statement],
            vars,
            options,
        });
    }

    function prepare(statement) {
        return hostList.select().execute('prepare', {
            statement
        });
    }

    function stream() {

    }

    function destroy() {

    }

    function init() {
        // Returns a clean interface
        return { query, stream, destroy, execute: query };
    }

    // Exposes internals for unit testing
    return { query, stream, destroy, init, execute, prepare };
}

function create(options) {
    const scope = {
        localCache: { localPreparedStatements: {} },
        options: Object.assign({}, defaults, options)
    };

    return client(scope, hosts(scope));
}

/* Exports -------------------------------------------------------------------*/

module.exports = create;