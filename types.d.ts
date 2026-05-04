export type ScyllaValue = string | number | boolean | null | Buffer | ScyllaValue[];

export interface ColumnInfo {
    keyspace: string;
    table: string;
    columnName: string;
    columnType: 'custom' | 'ascii' | 'bigint' | 'blob' | 'boolean' | 'counter' | 'decimal' | 'double' | 'float' | 'int' | 'text' | 'timestamp' | 'uuid' | 'varchar' | 'varint' | 'timeuuid' | 'inet' | 'date' | 'time' | 'smallint' | 'tinyint' | 'list' | 'map' | 'set' | 'udt' | 'tuple';
}

export interface Result<T = Record<string, ScyllaValue>> {
    rows: T[];
    rowLength: number;
    columns: ColumnInfo[];
    pageState: string | null;
    warnings: string[];
    metadata: {
        version: number;
        streamId: number;
        opcode: string;
        type: 'voidResult' | 'rows' | 'setKeyspace' | 'prepared' | 'schemaChange';
        columnsCount: number;
        rowsCount: number;
    };
}

export interface QueryOptions {
    consistency?: 'any' | 'one' | 'two' | 'three' | 'quorum' | 'all' | 'localQuorum' | 'eachQuorum' | 'serial' | 'localSerial' | 'localOne';
    timeout?: number;
    pageSize?: number;
    pageState?: string;
    prepare?: boolean;
    signal?: AbortSignal;
}

export interface ClientConfig {
    hosts: string | string[];
    keyspace?: string;
    credentials?: { username: string; password: string };
    tls?: boolean;
    port?: number;
    connections?: { local?: number; remote?: number };
    queryOptions?: Partial<QueryOptions>;
    queryTimeout?: number;
}

export interface BatchContext {
    query<T = Record<string, ScyllaValue>>(statement: string, vars?: ScyllaValue[], options?: QueryOptions): Promise<Result<T>>;
}

export interface Client {
    query<T = Record<string, ScyllaValue>>(statement: string, vars?: ScyllaValue[], options?: QueryOptions): Promise<Result<T>>;
    stream<T = Record<string, ScyllaValue>>(statement: string, vars?: ScyllaValue[], options?: QueryOptions): AsyncIterable<T>;
    batch(fn: (tx: BatchContext) => Promise<void>): Promise<void>;
    prepare(statement: string): Promise<void>;
    ready: Promise<void>;
    closed: Promise<void>;
    close(): Promise<void>;
}

declare module 'scylladb' {
    export function connect(config: ClientConfig): Client;

    export class ScyllaError {
        message: string
        name: string
        cause?: Error

        constructor(message: string, name?: string, cause?: Error)
    }
}
