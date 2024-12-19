import {stringMap, string, uint8, longString } from '../commons/encoder';
import { toUTF8StringRange } from '../commons/dataStructures';



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
                - AUTH_RESPONSE [LOOP]
            - AUTH_SUCCESS*/

export function authentication(scope) {
    let authStatus = 'pending';

    function init() {
        scope.once('connect', () => {
            const payload = {
                opcode: 'startup',
                streamId: -1,
                body: stringMap({
                    CQL_VERSION: scope.cqlVersion,
                    COMPRESSION: scope.compression
                })
            };
    
            scope.on('frame', step);
            scope.on('ready', () => scope.off('frame', step));
            scope.send(payload, true, true);
        });
    }

    function step(event) {
        if (authStatus === 'pending' && authOperations.includes(event.header.metadata.opcode)) {
            const alg = toUTF8StringRange(event.rawFrame, event.rawFrame.length - event.header.metadata.bodyLength, event.header.metadata.bodyLength);
            console.log(`auth "${alg}"`);

            authStatus = 'submitted';
            if (alg.includes('PasswordAuthenticator')) {
                console.log('returning for alg sasl')
                return scope.send({
                    opcode: 'authResponse',
                    streamId: -1,
                    body: [...longString(alg),0,...string(uint8, scope.options.credentials.username),0,...string(uint8, scope.options.credentials.password)]
                }, true, true);
            }

            return scope.send({
                opcode: 'authResponse',
                streamId: -1,
                body: [0,0,0,0]
            }, true, true);
        }
    }

    function terminate() {
        authStatus = 'terminate';
    }

    return { init, step, terminate};
}
