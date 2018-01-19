/**
 * Encoder and compressor
 */

/* Requires ------------------------------------------------------------------*/

const snappy = require('snappy');
const protocol = require('./protocol');

/* Methods -------------------------------------------------------------------*/

function frameHeader(options) {
    return Buffer.from([
        ...uint8(protocol.meta.version), 
        ...uint8(protocol.flagsOut[options.flags] || 0), 
        ...int16((options.streamId === undefined) ? 0 : options.streamId),
        ...uint8(protocol.opcodesOut[options.opcode]),
        ...int32(options.bodyLength)
    ]);
}

function uint8(val) {
    return [val & 0xff];
}

function uint16(val) {
    return [val >> 8, val & 0xff];
}

function uint32(val) {
    return [val >> 24, val >> 16, val >> 8, val & 0xff];
}

function int16(val) {
    if (val < 0) val = 0xffff + val + 1;
    return [val >> 8, val & 0xff];
}

function int32(val) {
    if (val < 0) val = 0xffffffff + val + 1;
    return [val >> 24, val >> 16, val >> 8, val & 0xff];
}

function content(payload, options) {
    const raw = new Buffer(payload);
    if (options.compression === 'snappy') {
        return snappy.compressSync(raw);
    }
    return raw;
}

function stringMap(obj) {
    const ret = uint16(Object.keys(obj));
    for (const item in obj) {
        const tmpStr = string(uint8, `${item}=${obj[item]}`);
        ret.push.apply(ret, uint16(tmpStr.length));
        ret.push.apply(ret, tmpStr);
    }
    return ret;
}

function query(params) {
    // console.log(params);
    return [
        ...longString(params.statement),
        ...uint16(protocol.queriesOut.consistencies[params.options.consistency]),
        0   // TODO: Prepared queries
    ];
}

function longString(str) {
    const bytes = Array.from(new Buffer(str));
    return [...int32(bytes.length), ...bytes];
}

function string(encoding, str) {
    const chars = [];
    for (let i = 0; i < str.length; i++) {
      chars.push.apply(chars, encoding(str.charCodeAt(i)));
    }
  
    return chars;
}

function request(params, options = {}) {
    const body = content(params.body, options);
    params.bodyLength = body.length;
    return Buffer.concat([frameHeader(params), body]);
}

/* Exports -------------------------------------------------------------------*/

module.exports = { request, frameHeader, stringMap, longString, query };