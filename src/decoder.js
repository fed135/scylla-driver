/**
 * Encoder and compressor
 */

/* Requires ------------------------------------------------------------------*/

const snappy = require('snappy');
const protocol = require('./protocol');

/* Methods -------------------------------------------------------------------*/

function frameHeader(header) {
    return {
        version: uint8(header[0]), 
        flags: uint8(header[1]), 
        streamId: uint16([header[2], header[3]]),
        opcode: uint8(header[4]),
        bodyLength: uint32(header.slice(5))
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

function response(bytes) {

}

/* Exports -------------------------------------------------------------------*/

module.exports = { frameHeader, uint8, uint16, uint32 };