/*- STARTUP
    - READY (no auth)
    - AUTH_CHALLENGE
        - AUTH_RESPONSE
            - AUTH_CHALLENGE
                - ...
            - AUTH_SUCCESS*/

/**
 * Authenticator
 */

/* Requires ------------------------------------------------------------------*/

const encoder = require('./encoder');
const decoder = require('./decoder');

/* Local variables -----------------------------------------------------------*/

const authOperations = [
    'authenticate',
    'credentials',
    'auth_challenge',
    'authSuccess',
];

/* Methods -------------------------------------------------------------------*/

function sequence(scope, method) {
    function begin() {
        const payload = {
            opcode: 'startup',
            streamId: -1,
            body: encoder.stringMap({
                CQL_VERSION: scope.cqlVersion,
                COMPRESSION: scope.compression
            })
        };

        method(encoder.request(payload));
    }

    function step(payload) {
        console.log('auth', payload);

        const payload = {
            opcode: 'authResponse',
            streamId: -1,
            body: ''
        };

        method(encoder.request(payload));
    }

    return { begin, step };
}

/* Exports -------------------------------------------------------------------*/

module.exports = { sequence, authOperations };