export function nodeInfo(scope) {
    let topologyRefreshTimer = null;

    function init() {
        step(); // Technically, this gets delayed until auth unlocks the connection queue
    }

    function step() {
        clearTimeout(topologyRefreshTimer);
        topologyRefreshTimer = setTimeout(step, 60000); // TODO: grab from config + check if disabled

        scope.execute('query', {
            statement: 'SELECT * FROM system.local;',
            options: scope.options.queryOptions,
        }).then((result) => {
            console.log('Scanned info for node:', result.rows[0].broadcast_address);
            if (!result.rows || result.rows.length < 1 || !result.rows[0].key) {
                console.error('Could not fetch node info');
                return null;
            } 
            // TODO: update token range, node info, etc
            scope.hostInfo.data_center = result.rows[0].data_center;
            scope.hostInfo.cluster_name = result.rows[0].cluster_name;
            scope.hostInfo.rack = result.rows[0].rack;
            scope.hostInfo.tokens = result.rows[0].tokens;
            scope.hostInfo.schema_version = result.rows[0].schema_version;
        });
    }

    function terminate() {
        clearTimeout(topologyRefreshTimer);
        topologyRefreshTimer = null;
    }

    return { init, terminate};
}