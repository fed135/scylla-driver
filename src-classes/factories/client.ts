import { Entity } from '../models/entity';
import { Component } from '../models/component';
import { Log } from '../components/log';
import { Socket } from '../components/socket';
import { ClientConfig, Client } from '../../types';

export interface ClientScope {
    config: ClientConfig
}

export function create(options: ClientConfig, extraComponents?: typeof Component<any>[]): Client {
    const instance: Entity<ClientScope> = new Entity<ClientScope>({ config: options }, [
        Log<ClientScope>,
        Socket<ClientScope>,
        ...(extraComponents || []),
    ]);

    instance.getComponentMethod(Socket)({ value: '0.0.0.0', params: {action: 'connect'}});

    function query(statement: string, vars, options) {
        const ref = instance.getComponentMethod(Log);
        if (ref) return ref({value: statement, params: {vars, options}});
    }

    function stream(statement: string, vars, options) {
        const ref = instance.getComponentMethod(Log);
        if (ref) return ref({value: statement, params: {vars, options}});
    }

    function destroy(statement: string, vars, options) {
        const ref = instance.getComponentMethod(Log);
        if (ref) return ref({value: statement, params: {vars, options}});
    }

    return {
        query,
        stream,
        destroy,
    };
}
