const scylla = require('../');
const uuid = require('uuid/v4');
const cassandra = require('cassandra-driver');

const db = scylla.createClient({
    hosts: ['172.17.0.2', '172.17.0.3'],
    workers: 2,
    keyspace: 'test'
});

/*
const client = new cassandra.Client({
    contactPoints: ['172.17.0.2', '172.17.0.3'],
    keyspace: 'test'
});
*/
const now = Date.now();

for(let i = 0; i<1000; i++) {
    //db.execute('SELECT * FROM test.users WHERE id = 2f4c6796-9152-4881-83f0-488e23f502c2');
    //client.execute('INSERT INTO test.users (id, fisrt_name, last_name, age) VALUES (' + uuid() + ', \'tom\', \'sawyer\', 99)');
    db.execute('SELECT * FROM test.users')
}
console.log('1000 inserts in ', (Date.now() - now), 'ms');