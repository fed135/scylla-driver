import { Entity } from './entity';

export interface StepPayload<T, P> {
    value: T
    params?: P
}

export class Component<T> {
    instance: Entity<T>
    
    constructor(entity: Entity<T>) {
        this.instance = entity;
        this.init();
    }

    public init(): void {
        console.log('Parent init');
    }

    public detach(): void {
        console.log('Parent detach');
    }

    public step(params: StepPayload<any, any>): any {}

    // TODO: No interface??
}
