/**
 * Encoder and compressor
 */

/* Requires ------------------------------------------------------------------*/

const snappy = require('snappy');
const protocol = require('./protocol');

/* Methods -------------------------------------------------------------------*/

function frameHeader(options) {
    return [
        uint8(protocol.version), 
        uint8(protocol.frameFlags[options.flags] || 0), 
        ...uint16(options.streamId || 0),
        uint8(protocol.opcodes[options.opcode]),
        ...uint32(options.bodyLength)
    ];
}

function uint8(val) {
    return val & 0xff;
}

function uint16(val) {
    return [val >> 8, val & 0xff];
}

function uint32(val) {
    return [val >> 24, val >> 16, val >> 8, val & 0xff];
}

function request() {
    return ;
}

/* Exports -------------------------------------------------------------------*/

module.exports = { request, frameHeader, uint8, uint16, uint32 };