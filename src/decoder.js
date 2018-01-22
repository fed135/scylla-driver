/**
 * Encoder and compressor
 */

/* Requires ------------------------------------------------------------------*/

const snappy = require('snappy');
const protocol = require('./protocol');

/* Methods -------------------------------------------------------------------*/

function frameHeader(bytes) {
    return {
        version: protocol.meta.version, 
        flags: protocol.flagsIn[int8(bytes[1])], 
        streamId: int16([bytes[2], bytes[3]]),
        opcode: protocol.opcodesIn[int8(bytes[4])],
        bodyLength: int32(bytes.slice(5, 9))
    };
}

function uint8(byte) {
    return byte | 0;
}

function uint16(bytes) {
    return bytes[0] << 8 | bytes[1];
}

function uint32(bytes) {
    return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3]);
}

function int8(byte) {
    return (!(byte & 0x80))?byte:((0xff - byte + 1) * -1);
}

function int16(bytes) {
    const val = (bytes[0] << 8) | bytes[1];
    return (val & 0x8000) ? val | 0xFFFF0000 : val;
}

function int32(bytes) {
    return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3]);
}

function content(bytes, options) {
    if (options.compression === 'snappy') {
        return snappy.uncompressSync(bytes);
    }
    return bytes.toString();
}

function request(bytes, options = {}) {
    return {
        header: frameHeader(bytes),
        body: content(bytes.slice(10), options)
    };
}

/* Exports -------------------------------------------------------------------*/

module.exports = { frameHeader, request, int32 };