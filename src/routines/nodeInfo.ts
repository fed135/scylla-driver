export function nodeInfo(scope) {
    let topologyRefreshTimer = null;

    function init() {
        step(); // Technically, this gets delayed until auth unlocks the connection queue
    }

    function step() {
        clearTimeout(topologyRefreshTimer);
        topologyRefreshTimer = setTimeout(step, 10000); // TODO: grab from config + check if disabled

        scope.execute('query', {
            statement: 'SELECT * FROM system.local;',
            options: scope.options.queryOptions,
        }).then((result) => {
            console.log('Scanned info for node:', result);
            // TODO: update token range, node info, etc
        });
    }

    function terminate() {
        clearTimeout(topologyRefreshTimer);
        topologyRefreshTimer = null;
    }

    return { init, terminate};
}