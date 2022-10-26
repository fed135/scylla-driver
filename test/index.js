const scylla = require('../');
const crypto = require('crypto');
const cassandra = require('cassandra-driver');

const db = scylla.createClient({
    hosts: ['172.17.0.2', '172.17.0.3'],
    workers: 4,
    keyspace: 'test'
});

/*
const client = new cassandra.Client({
    contactPoints: ['172.17.0.2', '172.17.0.3'],
    keyspace: 'test'
});
*/

const totalRequests = 10000;
const now = Date.now();
let completed = 0;
//console.log('\n');

for(let i = 0; i<totalRequests; i++) {
    db.query('INSERT INTO test.users (id, fisrt_name, last_name, age) VALUES (' + crypto.randomUUID() + ', \'tom\', \'sawyer\', 99)')
        .then(handleComplete); 
}

function handleComplete() {
    completed++;
    if (completed % 10 === 0) console.log(`${completed} requests ${(Date.now() - now)} ms`);
    if (completed === totalRequests) process.exit();
}
