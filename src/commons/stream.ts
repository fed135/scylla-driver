import * as v4 from './protocol/v4';
import { toUTF8StringRange } from './dataStructures';

const protocols = {4: v4, 5: v4}

export function streamDecode(stream: Array<number>, options) {
    let cursor = 0;

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

    function parseCell(range, type) {
        switch(type) {
            case 'varchar': return toUTF8StringRange(stream, range[0], range[1]);
            case 'int': return (stream[range[0]] << 24) | (stream[range[0]+1] << 16) | (stream[range[0]+2] << 8) | (stream[range[0]+3]);
        }
    }

    const metadata = {
        // Header (9 bytes)
        version: int8(),
        flags: protocols[options.protocolVersion || 4].flagsIn[int8()], 
        streamId: int16(),
        opcode: protocols[options.protocolVersion || 4].opcodesIn[int8()],
        bodyLength: int32(),

        // Response meta ()
        type: protocols[options.protocolVersion || 4].queriesIn.resultKind[int32()],
        queryFlags: unmask(int32(), protocols[options.protocolVersion || 4].responseFlagsOut) as { globalTableSpecs: boolean },
        columnsCount: int32(),
        rowsCount: null,
        newMetadataId: null,
        globalTableSpecs: {
            keyspace: '',
            table: '',
        },
        columns: []
    };

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
        };
        metadata.columns.push(column);
    }

    metadata.rowsCount = int32();
    const rows = [];

    while (rows.length < metadata.rowsCount && cursor < stream.length) {
        const row = {};
        for (let i = 0; i < metadata.columns.length; i++) {
            const range = bytes();
            row[metadata.columns[i].columnName] = parseCell(range, metadata.columns[i].columnType);
        }
        rows.push(row);
    }

    return {
        metadata,
        rows,
    }
}
