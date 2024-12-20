/*
 * Client methods
 */

import { queryPlan } from '../commons/queryPlan';
import defaults from '../defaults';
import {host} from './host';
import {EventEmitter} from 'node:events';

export function client(scope) {
    if (!scope.options.hosts) throw new Error('No hosts provided');
    if (!Array.isArray(scope.options.hosts)) scope.options.hosts = [scope.options.hosts];

    const hostList = scope.options.hosts.map(host.bind(null, scope));
    let roundRobinIndex = 0;
    const queryPlanner = queryPlan(hostList, scope.options);
    const eventTarget = new EventEmitter();

    function addHost() {

    }

    function removeHost() {

    }

    function selectHost() {
        const hostname = hostList[roundRobinIndex];
        roundRobinIndex++;
        
        if (roundRobinIndex >= hostList.length) roundRobinIndex = 0;
        return hostname;
    }

    function topology() {
        // Should be returned by the service
        // return JSON.parse(JSON.stringify(list));
    }

    // TODO: Prepared queries exist at the node level... maybe clean this section
    function query(statement, vars, options) {
        if (options === undefined && !Array.isArray(vars)) {
            options = vars || {};
            vars = [];
        }
        if (!Array.isArray(vars)) vars = [vars];

        const finalQueryOptions = Object.assign({}, scope.options.queryOptions, options);

        queryPlanner.parse(statement, vars, finalQueryOptions);

        const selectedHost = selectHost(); // TODO: pull from query planner

        if (finalQueryOptions.prepare === true || (statement.indexOf('?') > -1 && vars.length > 0)) {
            if (!(statement in scope.localCache.localPreparedStatements)) {
                return _prepare(selectedHost, statement).then(result => {
                    scope.localCache.localPreparedStatements[statement] = {
                        id: result.metadata.preparedId,
                        resultId: result.metadata.resultMetadataId,
                    };

                    return _execute(selectedHost, statement, vars, finalQueryOptions);
                });
            }
            return _execute(selectedHost, statement, vars, finalQueryOptions);
        }

        return selectedHost.execute('query', {
            statement,
            vars,
            options: finalQueryOptions,
        });
    }

    function _execute(host, statement, vars, options) {
        return host.execute('execute', {
            preparedId: scope.localCache.localPreparedStatements[statement].id,
            resultMetadataId: scope.localCache.localPreparedStatements[statement].resultId,
            vars,
            options,
        });
    }

    function _prepare(host, statement) {
        return host.execute('prepare', {
            statement
        });
    }

    function stream() {

    }

    function destroy() {
       return hostList.map(h => h.close());
    }

    function init() {
        // Returns a clean interface
        return {...eventTarget, query, stream, destroy };
    }

    // Exposes internals for unit testing
    return {...eventTarget, query, stream, destroy, init, _execute, _prepare };
}

export function createClient(options) {
    const scope = {
        localCache: { localPreparedStatements: {} },
        options: Object.assign({}, defaults, options)
    };

    return client(scope);
}
