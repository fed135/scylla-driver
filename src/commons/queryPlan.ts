import {v3} from 'murmurhash';

export function queryPlan(hosts, connectionOptions) {
    function parse(statement, vars, queryOptions) {

        if (vars.length && hosts.some(h => h.hostInfo.tokens.length > 0)) {
            // See: https://stackoverflow.com/questions/52564139/what-is-the-algorithm-behind-cassandras-token-function
            // I don't think this is right... definitly not
            const hash = v3(vars[0]);
            let tests = 0;

            console.log('id hash', hash, hosts[0].hostInfo.tokens[0])
            for (let h = 0; h < hosts.length; h++) {
                for (let t = 0; t < hosts[h].hostInfo.tokens.length; t++) {
                    if (hash > hosts[h].hostInfo.tokens[t] && hash < hosts[h].hostInfo.tokens[Math.min(t+1, hosts[h].hostInfo.tokens.length -1)]) {
                        console.log('prefer host: ', hosts[h], 'after', tests, 'tests');
                        return hosts[h];
                    }
                    tests++;
                }
            }
        }
    }

    return { parse }
}
