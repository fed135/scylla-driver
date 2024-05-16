import * as scylla from '../index';
import {Client} from '../types';
//import {randomUUID} from 'node:crypto';
import * as cassandra from 'cassandra-driver'
const distance = cassandra.types.distance;

/*const db: Client = scylla.createClient({
    hosts: ['0.0.0.0'],
    keyspace: 'test'
});*/


//db.query("CREATE KEYSPACE test WITH replication = {'class':'SimpleStrategy', 'replication_factor': 1};");
//db.query("CREATE TABLE test.users ( id text PRIMARY KEY, first_name text, last_name text, age int); ").then((result) => console.log('result', result));
//db.query('INSERT INTO test.users (id, first_name, last_name, age) VALUES (\'' + randomUUID() + '\', \'tom\', \'sawyer\', 99)').then((result) => console.log('result', result));

//db.query('SELECT * from test.users').then((result) => console.log('result', result));

let startHeap = process.memoryUsage().rss;
const loadTest = async (repeatCount: number, libId) => {
  let db: Client;
  let client;

  if (libId === 1) {
    db = scylla.createClient({
        hosts: ['0.0.0.0'],
        keyspace: 'test',
        connections: {
            local: 1
        }
    });
  }
  if (libId === 2) {
    client = new cassandra.Client({
        contactPoints: ['0.0.0.0'],
        localDataCenter: 'datacenter1',
        keyspace: 'test',
        pooling: {
            coreConnectionsPerHost: {
              [distance.local]: 1,
            }
        }
    });
  }

  console.log(`Load testing ${libId} with ${repeatCount} queries...`);
  const start = Date.now();
  for (let i = 0; i < repeatCount; i++) {
    if (libId === 1) await db.query('SELECT * FROM test.users');
    if (libId === 2) await client.execute('SELECT * from test.users');
  }
  console.log(`Load test took ${Date.now() - start}ms for ${repeatCount} queries!`);
  console.log('Heap difference:', ((process.memoryUsage().rss - startHeap) / 1024).toFixed(2))
};

loadTest(1000, 1).then(() => process.exit(0));
