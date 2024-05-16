/**
 * Encoder
 */

import * as v4 from './protocol/v4';

const protocols = {4: v4, 5: v4}

export function frameHeader(options) {
    return Buffer.from([
        ...int8(protocols[options.protocolVersion || 4].meta.version), 
        ...int8(protocols[options.protocolVersion || 4].flagsOut[options.flags] || 0), 
        ...int16((options.streamId === undefined) ? 0 : options.streamId),
        ...int8(protocols[options.protocolVersion || 4].opcodesOut[options.opcode]),
        ...int32(options.bodyLength)
    ]);
}

export function uint8(val) {
    return [val & 0xff];
}

export function uint16(val) {
    return [val >> 8, val & 0xff];
}

export function uint32(val) {
    return [val >> 24, val >> 16, val >> 8, val & 0xff];
}

export function int8(val) {
    return [(val < 0) ? 256 + val : val];
}

export function int16(val) {
    if (val < 0) val = 0xffff + val + 1;
    return [val >> 8, val & 0xff];
}

export function int32(val) {
    if (val < 0) val = 0xffffffff + val + 1;
    return [val >> 24, val >> 16, val >> 8, val & 0xff];
}

function content(payload, options) {
    const raw = Buffer.from(payload);
    if (options.compression && typeof options.compression.compressSync === 'function') {
        return options.compression.compressSync(raw);
    }
    return raw;
}

export function stringMap(obj) {
    const ret = uint16(Object.keys(obj));
    for (const item in obj) {
        const tmpStr = string(uint8, `${item}=${obj[item]}`);
        ret.push.apply(ret, uint16(tmpStr.length));
        ret.push.apply(ret, tmpStr);
    }
    return ret;
}

export function query(body, options) {
    return [
        ...longString(body.statement),
        ...uint16(protocols[options.protocolVersion || 4].queriesOut.consistencies[body.options.consistency]),
        0,
    ];
}

export function prepare(body) {
    return [
        ...longString(body.statement),
    ];
}

export function execute(body, options) {
    return [
        ...shortString(body.preparedId),
        ...uint16(protocols[options.protocolVersion || 4].queriesOut.consistencies[body.options.consistency]),
    ];
}

export function longString(str) {
    const bytes = [...Buffer.from(str)];
    return [...int32(bytes.length), ...bytes];
}

export function shortString(str) {
    const bytes = [...Buffer.from(str)];
    return [...int16(bytes.length), ...bytes];
}

export function string(encoding, str) {
    const chars = [];
    for (let i = 0; i < str.length; i++) {
      chars.push.apply(chars, encoding(str.charCodeAt(i)));
    }
  
    return chars;
}

export function request(params, options = {}) {
    const body = content(params.body, options);
    params.bodyLength = body.length;
    return Buffer.concat([frameHeader(params), body]);
}
