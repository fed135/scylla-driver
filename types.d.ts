interface ClientConfig {

}

interface Client {
    
}


declare module 'scylladb' {
    /**
     * Starts a client instance and attempts to connect to a cluster
     */
    export const createClient: (config: ClientConfig) => Client;
}