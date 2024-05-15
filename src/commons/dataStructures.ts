/**
 * Utility methods for data structures
 */

export function flipMap(obj) {
    const ret = {};
    for (const item in obj) {
        ret[obj[item]] = item;
    }
    return ret;
}

export function flipNested(obj) {
    const ret = {};
    for (const nested in obj) {
        ret[nested] = flipMap(obj[nested]);
    }
    return ret;
}
