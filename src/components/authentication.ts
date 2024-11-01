/**
 * Authenticator
 */

import {request, stringMap, string, uint8, longString } from '../commons/encoder';


export const authOperations = [
    'authenticate',
    'credentials',
    'auth_challenge',
];

/*- STARTUP
    - READY (no auth)
    - AUTH_CHALLENGE
        - AUTH_RESPONSE
            - AUTH_CHALLENGE
                - ...
            - AUTH_SUCCESS*/

// TODO: Move sequence construct to it's own Commons module
export function sequence(scope, method) {
    function begin() {
        const payload = {
            opcode: 'startup',
            streamId: -1,
            body: stringMap({
                CQL_VERSION: scope.cqlVersion,
                COMPRESSION: scope.compression
            })
        };

        method(request(payload));
    }

    function step(data, alg) {
        console.log(`auth "${alg}"`);

        if (alg.includes('PasswordAuthenticator')) {
            console.log('returning for alg sasl')
            return method(request({
                opcode: 'authResponse',
                streamId: -1,
                body: [...longString(alg),0,...string(uint8, scope.options.credentials.username),0,...string(uint8, scope.options.credentials.password)]
            }));
        }

        return method(request({
            opcode: 'authResponse',
            streamId: -1,
            body: [0,0,0,0]
        }));
    }

    return { begin, step };
}
