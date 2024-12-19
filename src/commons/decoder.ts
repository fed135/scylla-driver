/**
 * Encoder and compressor
 */

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
