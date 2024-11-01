import { create } from './factories/client';
import defaults from './defaults';
import { ClientConfig } from '../types';

export function createClient(options: ClientConfig) {
    return create(Object.assign({}, defaults, options));
}

const c = createClient({
    hosts: ['0.0.0.0'],
    keyspace: 'test'
});

c.query('SELECT * from test.user').then(() => {console.log('test')})