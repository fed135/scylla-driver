export default class Queue {
    #method: Function
    locked: boolean
    #list: any[] = []

    constructor(method: Function, options: {locked?: boolean} = {}) {
        this.#method = method;
        this.locked = options.locked ?? false;
    }

    lock() {
        this.locked = true;
        return this;
    }

    unlock() {
        this.locked = false;
        this.#step();
        return this;
    }

    add(request: any) {
        this.#list.push(request);
        this.#step();
        return this;
    }

    #step() {
        if (this.#list.length > 0 && this.locked === false) {
            this.#method(this.#list.shift());
            this.#step();
        }
        return this;
    }

    size() {
        return this.#list.length;
    }
}
