export default class ScyllaError {
    message: string
    name: string
    cause?: Error

    constructor(message: string, name?: string, cause?: Error) {
        this.message = message;
        this.name = name ?? 'ScyllaError';
        this.cause = cause;
    }

    static QueryError(message: string, cause?: Error) {
        return new ScyllaError(message, 'QueryError', cause);
    }

    static TimeoutError(message: string, cause?: Error) {
        return new ScyllaError(message, 'TimeoutError', cause);
    }

    static AbortError(message: string, cause?: Error) {
        return new ScyllaError(message, 'AbortError', cause);
    }

    static ConnectionError(message: string, cause?: Error) {
        return new ScyllaError(message, 'ConnectionError', cause);
    }

    static AuthError(message: string, cause?: Error) {
        return new ScyllaError(message, 'AuthError', cause);
    }
}
