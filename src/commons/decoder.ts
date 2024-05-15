/**
 * Encoder and compressor
 */

const v4 = require('./protocol/v4');
const v5 = require('./protocol/v5');

const protocols = {4: v4, 5: v5}

export function frameHeader(bytes, options) {
    return {
        version: protocols[options.protocolVersion || 4].meta.version, 
        flags: protocols[options.protocolVersion || 4].flagsIn[int8(bytes[1])], 
        streamId: int16([bytes[2], bytes[3]]),
        opcode: protocols[options.protocolVersion || 4].opcodesIn[int8(bytes[4])],
        bodyLength: int32(bytes.slice(5, 9))
    };
}

export function uint8(byte) {
    return byte | 0;
}

export function uint16(bytes) {
    return bytes[0] << 8 | bytes[1];
}

export function uint32(bytes) {
    return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3]);
}

export function int8(byte) {
    return (!(byte & 0x80))?byte:((0xff - byte + 1) * -1);
}

export function int16(bytes) {
    const val = (bytes[0] << 8) | bytes[1];
    return (val & 0x8000) ? val | 0xFFFF0000 : val;
}

export function int32(bytes) {
    return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3]);
}

function content(bytes, options) {
    if (options.compression && options.compression.uncompressSync) {
        return options.compression.uncompressSync(bytes);
    }
    return bytes.toString();
}

export function request(bytes, options = {}) {
    return {
        header: frameHeader(bytes, options),
        body: content(bytes.slice(10), options)
    };
}

/* Exports -------------------------------------------------------------------*/

module.exports = { frameHeader, request, int32 };