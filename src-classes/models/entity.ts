import { EventEmitter } from 'node:events';
import { Component } from './component';

export class Entity<T> extends EventEmitter {
    #components: Component<any>[] = [];
    scope: T;

    constructor(scope: T, components?: typeof Component<T>[]) {
        super();

        this.scope = scope;

        // TODO: Prevent multiple instantiation of the same component on an Entity
        this.#components = (components || []).map((C, i) => new C(this));
    }

    getComponentMethod(component) {
        const ref = this.#components.find((c) => c instanceof component);
        if (!ref) throw Error(`Unable to find attached component ${component}`);
        return ref.step.bind(ref);
    }
}
