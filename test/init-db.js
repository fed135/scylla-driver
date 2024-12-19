const cassandra = require('cassandra-driver');
const {randomUUID} = require('node:crypto');


const db = new cassandra.Client({
    contactPoints: ['0.0.0.0'],
    localDataCenter: 'datacenter1',
    //keyspace: 'test'
});


db.execute("CREATE KEYSPACE test WITH replication = {'class':'SimpleStrategy', 'replication_factor': 1};").catch((e) => console.log(e)).then(() => console.log('Created keyspace'))
    .then(() => {
        return db.execute("CREATE TABLE test.users ( id text PRIMARY KEY, first_name text, last_name text, age int); ").then((result) => console.log('Created table'));
    })
    .then(() => {
        return db.execute('INSERT INTO test.users (id, first_name, last_name, age) VALUES (\'' + randomUUID() + '\', \'tom\', \'sawyer\', 99)').then((result) => console.log('Inserted row'));
    })
    .then(() => {
        console.log('Database initialized!');
        process.exit(0);
    });
