export interface ClientConfig {
    hosts: string[]
    keyspace: string
    compression?: {
        uncompressSync?: Function
        compressSync?: Function
    }
}

interface ColumnDefinition {
    keyspace: string
    table: string
    columnName: string
    columnType: 'custom' | 'ascii' | 'bigint' | 'blob' | 'boolean' | 'counter' | 'decimal' | 'double' | 'float' | 'int' | 'text' | 'timestamp' | 'uuid' | 'varchar' | 'varint' | 'timeuuid' | 'inet' | 'date' | 'time' | 'smallint' | 'tinyint' | 'list' | 'map' | 'set' | 'udt' | 'tuple'
}

interface QueryResponse<T> {
    metadata: {
        version: number
        flags: number
        streamId: number
        opcode: 'error' | 'ready' | 'result' | 'authenticate' | 'credentials' | 'options' | 'supported' | 'query' | 'prepare' | 'execute' | 'register' | 'event' | 'batch' | 'authChallenge' | 'authResponse' | 'authSuccess'
        bodyLength: number
        type: 'voidResult' | 'rows' | 'setKeyspace' | 'prepared' | 'schemaChange'
        queryFlags: {
            globalTableSpecs: boolean
            hasMorePages: boolean
            noMetadata: boolean
            metadataChanged: boolean
            continuousPaging: boolean
            lastContinuousPage: boolean
          }
          columnsCount: number
          rowsCount: number
          newMetadataId: string
          globalTableSpecs: {
            keyspace?: string
            table?: string
        }
        columns: ColumnDefinition[]
    }
    rows: T[]
}

interface QueryOptions {

}

interface QueryStream<T> {
    pause(): void
    resume(): void

    on<k extends keyof ClientStreamEventMap<T>>(event: k, listener: ClientStreamEventMap<T>[k]): this;
    once<k extends keyof ClientStreamEventMap<T>>(event: k, listener: ClientStreamEventMap<T>[k] | Function): this;
    removeListener<k extends keyof ClientStreamEventMap<T>>(event: k, listener: ClientStreamEventMap<T>[k] | Function): this;
    off<k extends keyof ClientStreamEventMap<T>>(event: k, listener: ClientStreamEventMap<T>[k] | Function): this;
}

export interface Client {
    query<T>(statement: string, options?: QueryOptions): Promise<QueryResponse<T>>
    query<T>(statement: string, vars: Array<string|number|Date|null>, options?: QueryOptions): Promise<QueryResponse<T>>

    stream<T>(statement: string, options?: QueryOptions): Promise<QueryStream<T>>
    stream<T>(statement: string, vars: Array<string|number|Date|null>, options?: QueryOptions): Promise<QueryStream<T>>

    destroy(): void

    on<k extends keyof ClientEventMap>(event: k, listener: ClientEventMap[k]): this;
    once<k extends keyof ClientEventMap>(event: k, listener: ClientEventMap[k] | Function): this;
    removeListener<k extends keyof ClientEventMap>(event: k, listener: ClientEventMap[k] | Function): this;
    off<k extends keyof ClientEventMap>(event: k, listener: ClientEventMap[k] | Function): this;
}

interface ClientEventMap {
    'error': (error: Error) => void
}

interface ClientStreamEventMap<T> {
    'row': (row: T) => void
    'end': () => void
    'error': (error: Error) => void
}

declare module 'scylladb' {
    /**
     * Starts a client instance and attempts to connect to a cluster
     */
    export const createClient: (config: ClientConfig) => Client;
}