import * as scylla from '../index';
import {Client} from '../types';
//import {randomUUID} from 'node:crypto';
import * as cassandra from 'cassandra-driver'
const distance = cassandra.types.distance;

interface User {
  id: string
  age: number
  first_name: string
  last_name: string
}

let startHeap = process.memoryUsage().rss;
const loadTest = async (repeatCount: number, libId) => {
  let db: Client;
  let client: cassandra.Client;

  if (libId === 1) {
    db = scylla.createClient({
        hosts: ['0.0.0.0'],
        keyspace: 'test',
        connections: {
            local: 1
        },
        /*credentials: {
          username: 'scylla',
          password: 'eX5HfOEW0TJAv6n',
        }*/
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
    if (libId === 1) await db.query<User>('SELECT * FROM system.peers').then((res) => console.log('RES',res.rows.map(r => r.peer.toString())));
    if (libId === 2) {
      await client.execute('SELECT * FROM system.peers').then((res) => console.log('RES',res.rows.map(r => r.peer.toString())));
      await client.execute('SELECT * FROM system.local').then((res) => console.log('RES',res.rows));
    }
  }
  console.log(`Load test took ${Date.now() - start}ms for ${repeatCount} queries!`);
  console.log('Heap difference:', ((process.memoryUsage().rss - startHeap) / 1024).toFixed(2))
};

loadTest(1, 1).then(() => {
  /*setTimeout(() => {
    process.exit(0);
  }, 10000);*/
});
