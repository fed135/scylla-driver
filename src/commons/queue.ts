/**
 * Generic method queue
 */

export function queue(method, options: {locked?: boolean} = {}) {
    const list = [];
    const self = { add, step, lock, unlock, size };
    let locked = options.locked || false;

    function lock() {
        locked = true;
        return self;
    }

    function unlock() {
        locked = false;
        step();
        return self;
    }

    function add(request) {
        list.push(request);
        step();
        return self;
    }

    function step() {
        if (list.length > 0 && locked === false) {
            method(list.shift());
            step();
        }
        return self;
    }

    function size() {
        return list.length;
    }

    return self;
}
