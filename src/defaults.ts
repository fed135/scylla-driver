type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export type Options = {
  hosts: string[]
  port: number
  poolSize: number
  queryOptions: {
    consistency: 'any' | 'one' | 'two' | 'three' | 'quorum' | 'all' | 'localQuorum' | 'eachQuorum' | 'serial' | 'localSerial' | 'localOne'
    limit: number
    prepare: boolean
  }
  compression: string | null
  credentials: { username: string, password: string } | null
  cqlVersion: '3.0.0'
  cassandraProtocol: 'v4' | 'v5' | null
  maxPrepared: number
  queryTimeout: number
  baseReconnectTimeMs: number
  maxRetryAttempts: number
  refreshSchemaDelay: number
  isMetadataSyncEnabled: boolean
};

export default {
  hosts: [],
  port: 9042,
  poolSize: 10,
  queryOptions: {
    consistency: 'localOne',
    limit: 1000,
    prepare: false,
  },
  compression: null,
  credentials: null,
  cqlVersion: '3.0.0',
  // cassandraProtocol: (auto pick from server, supports v4 and v5) // https://docs.datastax.com/en/developer/java-driver/4.0/manual/core/native_protocol/index.html
  maxPrepared: 5000,
  queryTimeout: 12000,
  baseReconnectTimeMs: 500,
  maxRetryAttempts: 5,
  /* refreshSchemaDelay: 1000,
  isMetadataSyncEnabled: true
  */
} as RecursivePartial<Options> & { hosts: [] };
