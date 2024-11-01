/*
 * Client methods
 */

import defaults from '../defaults';
import {host} from './host';
import {EventEmitter} from 'node:events';

export function client(scope) {
    console.log(scope)
    if (!scope.options.hosts) throw new Error('No hosts provided');
    if (!Array.isArray(scope.options.hosts)) scope.options.hosts = [scope.options.hosts];

    const hostList = scope.options.hosts.map(host.bind(null, scope));
    let roundRobinIndex = 0;
    const eventTarget = new EventEmitter();

    function addHost() {

    }

    function removeHost() {

    }

    function selectHost() {
        console.log(hostList)
        const hostname = hostList[roundRobinIndex];
        roundRobinIndex++;
        
        if (roundRobinIndex >= hostList.length) roundRobinIndex = 0;
        return hostname;
    }

    function topology() {
        // Should be returned by the service
        // return JSON.parse(JSON.stringify(list));
    }

    function query(statement, vars, options) {
        if (options === undefined) {
            options = vars || {};
            vars = [];
        }

        const finalQueryOptions = Object.assign({}, scope.options.queryOptions, options);

        if (finalQueryOptions.prepare === true) {
            if (!(statement in scope.localCache.localPreparedStatements)) {
                return prepare(statement).then(preparedId => {
                    scope.localCache.localPreparedStatements[statement] = preparedId;

                    return execute(statement, vars, finalQueryOptions);
                });
            }
            return execute(statement, vars, finalQueryOptions);
        }

        return selectHost().execute('query', {
            statement,
            vars,
            options: finalQueryOptions,
        });
    }

    function execute(statement, vars, options) {
        return selectHost().execute('execute', {
            preparedId: scope.localCache.localPreparedStatements[statement],
            vars,
            options,
        });
    }

    function prepare(statement) {
        return selectHost().execute('prepare', {
            statement
        });
    }

    function stream() {

    }

    function destroy() {

    }

    function init() {
        // Returns a clean interface
        return {...eventTarget, query, stream, destroy };
    }

    // Exposes internals for unit testing
    return {...eventTarget, query, stream, destroy, init, execute, prepare };
}

export function createClient(options) {
    const scope = {
        localCache: { localPreparedStatements: {} },
        options: Object.assign({}, defaults, options)
    };

    return client(scope);
}
