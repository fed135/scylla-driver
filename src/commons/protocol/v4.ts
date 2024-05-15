/**
 * Protocol flag mapping 
 */

import  { flipMap, flipNested }  from '../dataStructures';

export const meta = {
    version:                    0x04,
    minSupported:               0x04,
    maxSupported:               0x05
};

export const opcodesOut = {
    error:                      0x00,
    startup:                    0x01,
    ready:                      0x02,
    authenticate:               0x03,
    credentials:                0x04,
    options:                    0x05,
    supported:                  0x06,
    query:                      0x07,
    result:                     0x08,
    prepare:                    0x09,
    execute:                    0x0a,
    register:                   0x0b,
    event:                      0x0c,
    batch:                      0x0d,
    authChallenge:              0x0e,
    authResponse:               0x0f,
    authSuccess:                0x10,
};

export const opcodesIn = flipMap(opcodesOut);

export const flagsOut = {
    compression:                0x01,
    tracing:                    0x02,
    customPayload:              0x04,
    warning:                    0x08
};

export const flagsIn = flipMap(flagsOut);


export const queriesOut = {
    consistencies: {
        any:                    0x00,
        one:                    0x01,
        two:                    0x02,
        three:                  0x03,
        quorum:                 0x04,
        all:                    0x05,
        localQuorum:            0x06,
        eachQuorum:             0x07,
        serial:                 0x08,
        localSerial:            0x09,
        localOne:               0x0a
    },
    errorCodes: {
        serverError:            0x0000,
        protocolError:          0x000A,
        badCredentials:         0x0100,
        unavailableException:   0x1000,
        overloaded:             0x1001,
        isBootstrapping:        0x1002,
        truncateError:          0x1003,
        writeTimeout:           0x1100,
        readTimeout:            0x1200,
        readFailure:            0x1300,
        functionFailure:        0x1400,
        writeFailure:           0x1500,
        syntaxError:            0x2000,
        unauthorized:           0x2100,
        invalid:                0x2200,
        configError:            0x2300,
        alreadyExists:          0x2400,
        unprepared:             0x2500
    },
    resultKind: {
        voidResult:             0x0001,
        rows:                   0x0002,
        setKeyspace:            0x0003,
        prepared:               0x0004,
        schemaChange:           0x0005
    }
};

export const queriesIn = flipNested(queriesOut);

export const dataOut = {
    types: {
        custom:                 0x0000,
        ascii:                  0x0001,
        bigint:                 0x0002,
        blob:                   0x0003,
        boolean:                0x0004,
        counter:                0x0005,
        decimal:                0x0006,
        double:                 0x0007,
        float:                  0x0008,
        int:                    0x0009,
        text:                   0x000a,
        timestamp:              0x000b,
        uuid:                   0x000c,
        varchar:                0x000d,
        varint:                 0x000e,
        timeuuid:               0x000f,
        inet:                   0x0010,
        date:                   0x0011,
        time:                   0x0012,
        smallint:               0x0013,
        tinyint:                0x0014,
        list:                   0x0020,
        map:                    0x0021,
        set:                    0x0022,
        udt:                    0x0030,
        tuple:                  0x0031
    },
    distance: {
        local:                  0,
        remote:                 1,
        ignored:                2
    }
};

export const dataIn = flipNested(dataOut);

export const eventsOut = {
    topologyChange:             'TOPOLOGY_CHANGE',
    statusChange:               'STATUS_CHANGE',
    schemaChange:               'SCHEMA_CHANGE'
};

export const eventsIn = flipMap(eventsOut);
