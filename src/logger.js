/**
 * Logging util
 */

/* Methods -------------------------------------------------------------------*/

function print(level) {
    return function consolePrint(msg) {
        const enabled = ((typeof process === 'object' && process.env.NODE_DEBUG) || '').indexOf('scylla') > -1;
        if (enabled === true) console.log(`[${level}] SCYLLA(pid:${process.pid}) ${msg}`); // eslint-disable-line no-console
    }
}

/* Exports -------------------------------------------------------------------*/

module.exports = {
    log: print('log'),
    warn: print('warning'),
    error: print('error'),
};
