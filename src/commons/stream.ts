import * as v4 from './protocol/v4';
import { toUTF8StringRange } from './dataStructures';
import {unparse} from './uuid'

const protocols = {4: v4, 5: v4}

export function verifyPayload(stream, options) {
    const opcopde = protocols[options.protocolVersion || 4].opcodesIn[stream[4]];
    return opcopde;
}

export function streamDecode(stream: Array<number>, options) {
    let cursor = 0;

    function printNBytes(n) {
        console.log(`Next ${n} bytes:`, stream.slice(cursor, cursor+n));
    }

    function uint8() {
        cursor++;
        return stream[cursor-1] | 0;
    }
    
    function uint16() {
        cursor += 2;
        return stream[cursor-2] << 8 | stream[cursor-1];
    }
    
    function uint32() {
        cursor += 4;
        return (stream[cursor-4] << 24) | (stream[cursor-3] << 16) | (stream[cursor-2] << 8) | (stream[cursor-1]);
    }
    
    function int8() {
        cursor++;
        return (!(stream[cursor-1] & 0x80))?stream[cursor-1]:((0xff - stream[cursor-1] + 1) * -1);
    }
    
    function int16() {
        cursor += 2;
        const val = (stream[cursor-2] << 8) | stream[cursor-1];
        return (val & 0x8000) ? val | 0xFFFF0000 : val;
    }
    
    function int32() {
        cursor += 4;
        return (stream[cursor-4] << 24) | (stream[cursor-3] << 16) | (stream[cursor-2] << 8) | (stream[cursor-1]);
    }
    
    function shortBytesString() {
        const size = int16();
        if (size > 0) {
            cursor += size;
            return toUTF8StringRange(stream, cursor - size, size);
        }
        return '';
    }
    
    function bytesString() {
        const size = int32();
        if (size > 0) {
            cursor += size;
            return toUTF8StringRange(stream, cursor - size, size);
        }
        return '';
    }

    function bytes() {
        const size = int32();
        if (size > 0) {
            cursor += size;
            return [cursor - size, size];
        }
        return [cursor, 0];
    }

    function unmask(byteMask, flagsMap) {
        return Object.keys(flagsMap).reduce((acc, val, i) => {
            acc[val] = !!(byteMask & flagsMap[val]);
            return acc;
        }, {});
    }

    function parseCell(type, chunkSize) {

        switch(type) {
            case 'varchar': 
                if (chunkSize > 0) {
                    cursor += chunkSize;
                    return toUTF8StringRange(stream, cursor - chunkSize, chunkSize);
                }
                return ''
            case 'inet':
                if (chunkSize === 4) return `${uint8()}.${uint8()}.${uint8()}.${uint8()}`;
                cursor += chunkSize;
                return toUTF8StringRange(stream,  cursor - chunkSize, chunkSize);
            case 'int': return int32();
            case 'uuid': 
                cursor += chunkSize;
                return unparse(stream, cursor - chunkSize);
            default: 
                cursor += chunkSize;
                return `${type}`
        }
    }

    let metadata = {
        // Header (9 bytes)
        version: int8(),
        flags: protocols[options.protocolVersion || 4].flagsIn[int8()], 
        streamId: int16(),
        opcode: protocols[options.protocolVersion || 4].opcodesIn[int8()],
        bodyLength: int32(),
    };

    const rows = [];

    if (metadata.opcode === 'result') {
        // Response meta ()
        metadata.type = protocols[options.protocolVersion || 4].queriesIn.resultKind[int32()];
        metadata.queryFlags = unmask(int32(), protocols[options.protocolVersion || 4].responseFlagsOut) as { globalTableSpecs: boolean };
        metadata.columnsCount = int32();
        metadata.rowsCount = null;
        metadata.newMetadataId = null;
        metadata.globalTableSpecs = {
            keyspace: '',
            table: '',
        };
        metadata.columns = [];

        if (metadata.queryFlags.globalTableSpecs) {
            metadata.globalTableSpecs.keyspace = shortBytesString();
            metadata.globalTableSpecs.table = shortBytesString();
        }

        while (metadata.columns.length < metadata.columnsCount && cursor < stream.length) {
            const column = {
                keyspace: (metadata.queryFlags.globalTableSpecs) ? metadata.globalTableSpecs.keyspace : shortBytesString(),
                table: (metadata.queryFlags.globalTableSpecs) ? metadata.globalTableSpecs.table : shortBytesString(),
                columnName: shortBytesString(),
                columnType: protocols[options.protocolVersion || 4].dataIn.types[int16()],
                columnFormat: null,
            };

            //TODO: Some funky types have larger sizes than 2 bytes, do something cleaner
            if (column.columnType === 'set') {
                column.columnFormat = protocols[options.protocolVersion || 4].dataIn.types[int16()];
            }
            if (column.columnType === 'map') {
                column.columnFormat = [
                    protocols[options.protocolVersion || 4].dataIn.types[int16()],
                    protocols[options.protocolVersion || 4].dataIn.types[int16()],
                ];
            }
            metadata.columns.push(column);
        }

        metadata.rowsCount = int32();

        while (rows.length < metadata.rowsCount && cursor < stream.length) {
            const row = {};
            for (let i = 0; i < metadata.columns.length; i++) {
                const chunkSize = int32();
                if (chunkSize === -1) row[metadata.columns[i].columnName] = null;
                else row[metadata.columns[i].columnName] = parseCell(metadata.columns[i].columnType, chunkSize);
            }
            rows.push(row);
        }
    }

    return {
        metadata,
        rows,
    }
}
