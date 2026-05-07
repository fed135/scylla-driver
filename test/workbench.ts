import { connect } from '../src/index.ts';
import type { Client, Result } from '../types.d.ts';
// import {randomUUID} from 'node:crypto';
import * as cassandra from 'cassandra-driver';
const distance = cassandra.types.distance;

interface User {
  id: string
  age: number
  first_name: string
  last_name: string
}

type LIBS = 'scylla' | 'datastax';

const iterations = 1024;

const libs: { [lib in LIBS]: { setup: Function, teardown: Function, client: any, query: Function } } = {
  datastax: {
    setup: () => new cassandra.Client({
      contactPoints: ['0.0.0.0'],
      localDataCenter: 'datacenter1',
      keyspace: 'test',
      pooling: {
        coreConnectionsPerHost: {
          [distance.local]: 1,
        },
      },
    }),
    teardown: () => libs.datastax.client?.shutdown?.(),
    client: null,
    query: () => libs.datastax.client?.execute('SELECT * FROM test.users WHERE id = ? LIMIT 1', ['6ef444c7-0a81-4e92-959b-143459b6d766']).then(res => console.log('RES', res.rows.map(r => r.id.toString()))),
  },
  scylla: {
    setup: async () => connect({
      hosts: ['0.0.0.0:9042', '0.0.0.0:9043', '0.0.0.0:9044'],
      keyspace: 'test',
      poolSize: 1,
    }),
    teardown: () => libs.scylla.client?.close?.(),
    client: null,
    query: () => (libs.scylla.client as Client)?.query<User>('SELECT * FROM test.users WHERE id = ? LIMIT 1', ['6ef444c7-0a81-4e92-959b-143459b6d766']).then((res: Result<User>) => console.log('RES', res.rows.map(r => r.id.toString()))),
  },
};

async function loadTest(repeatCount: number, libId: LIBS) {
  const startHeap = process.memoryUsage().rss;

  console.log(`Load testing ${libId} with ${repeatCount} queries...`);

  libs[libId].client = await libs[libId].setup();

  console.log(`${libId} initialized...`);

  const start = Date.now();

  for (let i = 0; i < repeatCount; i++) {
    await libs[libId].query();
  }
  console.log(`Load test took ${Date.now() - start}ms for ${repeatCount} queries!`);
  console.log('Heap difference:', ((process.memoryUsage().rss - startHeap) / 1024).toFixed(2));

  libs[libId].teardown();
};

loadTest(iterations, 'scylla');
// .then(() => loadTest(iterations, 'datastax'));
