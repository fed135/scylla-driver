const scylla = require('../');

const db = scylla.createClient({
    hosts: ['172.17.0.2', '172.17.0.3'],
    workers: 2,
    keyspace: 'test'
});

db.execute('SELECT * from users').then(console.log, console.error);