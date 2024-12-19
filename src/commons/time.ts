let lastMicroTS = 0;

export function microSecondTS() {
    // Ensure monotonic timestamps by always counting up and never returning the same value twice.

    let ts = Number(Date.now() + String(process.hrtime()[1]).slice(3,6));
    if (ts <= lastMicroTS) ts = lastMicroTS + 1;

    lastMicroTS = ts;
    return ts;
}

