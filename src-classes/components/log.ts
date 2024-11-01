import { Component, StepPayload } from '../models/component';
import { Entity } from '../models/entity';

const logPriorities = ['error', 'warn', 'info'];
type LogParams = {
    priority: (typeof logPriorities)[number]
}

export class Log<T> extends Component<T> {
    constructor(entity: Entity<T>) {
        super(entity);
    }

    init(): void {
        console.log('logger init');
    }

    step({params, value}: StepPayload<string, LogParams>) {
        if (
            (((typeof process === 'object' && process.env.NODE_DEBUG) || '').indexOf('scylla') > -1) &&
            (logPriorities.indexOf(this.instance.config.logPriority) >= logPriorities.indexOf(params?.priority || 'error'))
        ) console.log(`[${params?.priority}] SCYLLA(pid:${process.pid}) ${value}`); // eslint-disable-line no-console
    }   
}