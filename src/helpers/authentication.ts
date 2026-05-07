import { toUTF8StringRange, deferred } from './utils.ts';
import type Connection from '../connection.ts';
import type { Options } from '../defaults.ts';

export default class AuthenticationHandler {
    status: number
    #readyState: { promise: Promise<Connection>, resolve: Function, reject: Function }
    #connection: Connection

    constructor(connection: Connection) {
        this.status = AuthenticationHandler.STATUS.pending;
        this.#readyState = deferred();
        this.#connection = connection;
    }

    #handleData(decoded) {
        if (decoded.metadata.opcode === 'ready') {
            console.log('ready!')
            this.#readyState.resolve(this.#connection);
        }
    }

    #handleError(err) {
        console.log('got error in auth handler', err);
    }

    begin(options: Options) {
        this.#connection.request({
            opcode: 'startup',
            streamId: -1,
        });
    }

    hook() {
        return { data: (d) => this.#handleData(d), error: this.#handleError, ready: this.#readyState.promise };
    }

    reset() {
        this.status = AuthenticationHandler.STATUS.pending;
        this.#readyState = deferred();
    }

    static STATUS = {
        pending: 0,
        ready: 1,
        authenticate: 2,
        credentials: 3,
        auth_challenge: 4,
    }
}
/*

export const authOperations = [
    'authenticate',
    'credentials',
    'auth_challenge',
];



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
*/