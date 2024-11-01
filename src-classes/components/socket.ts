import { Component, StepPayload } from '../models/component';
import { Entity } from '../models/entity';
import {connect as connectSocket, Socket as NodeSocket} from 'node:net';

type SocketStatus = 'waiting' | 'connecting' | 'ready' | 'closing'

interface WriteParams {
    action: 'write'
}

interface ConnectParams {
    action: 'connect'
}

export class Socket<T> extends Component<T> {
    #socket: NodeSocket | null
    #status: SocketStatus = 'waiting'

    #reconnectAttempts: number = 0

    constructor(entity: Entity<T>) {
        super(entity);
    }

    init(): void {
        console.log('socket init');        
    }

    step({params, value}: StepPayload<string, ConnectParams | WriteParams>) {
        if (params?.action === 'connect') this.connect(value);
        if (params?.action === 'write') this.write(value);
    }

    detach() {
        this.#status = 'closing';
        if (this.#socket) this.#socket.destroy();
        this.#socket = null;
    }

    private write(data) {
        if (this.#socket) this.#socket.write(data);
    }

    private connect(host) {
        if (this.#status === 'waiting') {
            this.#status = 'connecting';
            let [hostname, port] = host.split(':');
            if (hostname === '0.0.0.0') hostname = '127.0.0.1';

            if (hostname[0] !== '/') this.#socket = connectSocket(parseInt(port) || this.instance.scope.config.port, hostname);
            else this.#socket = connectSocket(host);

            this.#socket.on('connect', this.handleConnection);
            this.#socket.on('data', this.handleResponse);
            this.#socket.on('error', this.handleError);
            this.#socket.on('close', this.handleClose);
        }
    }

    private handleConnection() {
        this.#reconnectAttempts = 0;
        this.#status = 'ready';

        this.instance.emit('connected', this);
    }

    private handleResponse() {
        
    }

    private handleError() {
        
    }

    private handleClose() {
        if (this.#status !== 'closing') {
            this.#status = 'waiting';
            const delay = this.instance.scope.config.baseReconnectTimeMs + (this.#reconnectAttempts * this.instance.scope.config.baseReconnectTimeMs) * 1.5;
            this.#reconnectAttempts++;

            console.log('connection attempt', this.#reconnectAttempts, '/', this.instance.scope.config.maxRetryAttempts)
            if (this.#reconnectAttempts >= this.instance.scope.config.maxRetryAttempts) {
                throw new Error(`Unable to connect with host ${this.#socket?.remoteAddress}`);
            }

            setTimeout(this.connect, delay);
        }
    }
}

        