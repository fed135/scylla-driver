import mmh from 'murmurhash';
//import nsp from 'node-sql-parser';
import type Host from '../host';
import type { Options } from '../defaults';

export type ParsedQuery = {
    prepared: boolean
    singleIdSearch: boolean
    //readOnly: boolean
    statement: string
    vars: any[]
    options: any
    preferredHost?: Host
}

//const parser = new nsp.Parser();

export function queryPlan(statement: string, vars: any[], hosts: Host[], options: Options['queryOptions']): ParsedQuery {
    //const ast = parser.astify(statement);
    const parsed: ParsedQuery = {
        prepared: options.prepare === true || (statement.indexOf('?') > -1 && vars.length > 0),
        //readOnly: ast.type === 'select',
        singleIdSearch: (vars ?? []).length === 1 && !Array.isArray(vars[0]),
        statement,
        vars,
        options
    };

    if (parsed.singleIdSearch && hosts.some(h => h.nodeInfo.tokens?.length)) {
        // See: https://stackoverflow.com/questions/52564139/what-is-the-algorithm-behind-cassandras-token-function
        const hash = mmh.v3(vars[0]);
        let tests = 0;

        for (let h = 0; h < hosts.length; h++) {
            for (let t = 0; t < hosts[h].nodeInfo.tokens?.length ?? 0; t++) {
                if (hash > hosts[h].nodeInfo.tokens[t] && hash < hosts[h].nodeInfo.tokens[Math.min(t+1, hosts[h].nodeInfo.tokens.length -1)]) {
                    //console.log('prefer host: ', hosts[h], 'after', tests, 'tests out of ', hosts[h].nodeInfo.tokens?.length, 'tokens');
                    parsed.preferredHost = hosts[h];
                    break;
                }
                tests++;
            }
        }
    }

    return parsed;
}
