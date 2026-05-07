import type {QueryContext} from '../writer.ts';

export default class ScyllaError {
    message: string
    name: string
    cause?: Error
    context?: QueryContext

    constructor(message: string, name?: string, cause?: Error, context?: QueryContext) {
        this.message = message;
        this.name = name ?? 'ScyllaError';
        this.cause = cause;
        this.context = context;
    }

    static QueryError(message: string, cause?: Error, context?: QueryContext) {
        return new ScyllaError(message, 'QueryError', cause, context);
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
