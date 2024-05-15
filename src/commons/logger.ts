/**
 * Logging util
 */

function print(level) {
    return function consolePrint(msg) {
        const enabled = ((typeof process === 'object' && process.env.NODE_DEBUG) || '').indexOf('scylla') > -1;
        if (enabled === true) console.log(`[${level}] SCYLLA(pid:${process.pid}) ${msg}`); // eslint-disable-line no-console
    }
}

export const log = print('log');
export const warn = print('warning');
export const error = print('error');
