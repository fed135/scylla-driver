import type Connection from "../connection";

export abstract class LoadBalancer<Item> {
    items: Item[]
    limit: number
    spawn: () => Item

    constructor(items: Item[], limit: number, spawn: () => Item) {
        this.items = items;
        this.limit = limit;
        this.spawn = spawn;
    }

    abstract getNext(): Item
}

export class RoundRobin<Item> extends LoadBalancer<Item> {
    #currentIndex: number

    constructor(items: Item[], limit: number, spawn: () => Item) {
        super(items, limit, spawn);

        this.#currentIndex = -1;
    }

    getNext() {
        this.#currentIndex++;
        if (this.#currentIndex > this.items.length - 1) {
            if (this.items.length < this.limit) {
                const item = this.spawn();
                this.items.push(item);
                return item;
            }
            this.#currentIndex = 0;
        }
        return this.items[this.#currentIndex];
    }
}

export class LoadAware<Item> extends LoadBalancer<Item> {
    constructor(items: Item[], limit: number, spawn: () => Item) {
        super(items, limit, spawn);

        while(this.items.length < this.limit) {
            const item = this.spawn();
            this.items.push(item);
        }
    }

    getNext() {
        const loads = this.items.toSorted((a, b) => (a as Connection).load() - (b as Connection).load());

        return loads[0];
    }
}