/**
 * Utility methods
 */

/* Methods -------------------------------------------------------------------*/

function flipMap(obj) {
    const ret = {};
    for (const item in obj) {
        ret[obj[item]] = item;
    }
    return ret;
}

function flipNested(obj) {
    const ret = {};
    for (const nested in obj) {
        ret[nested] = flipMap(obj[nested]);
    }
    return ret;
}

/* Exports -------------------------------------------------------------------*/

module.exports = {
    flipMap,
    flipNested
};
