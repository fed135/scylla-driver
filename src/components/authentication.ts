/**
 * Authenticator
 */

import {request, stringMap } from '../commons/encoder';


export const authOperations = [
    'authenticate',
    'credentials',
    'auth_challenge',
    'authSuccess',
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

    function step(data) {
        console.log('auth', data);

        const payload = {
            opcode: 'authResponse',
            streamId: -1,
            body: ''
        };

        method(request(payload));
    }

    return { begin, step };
}
