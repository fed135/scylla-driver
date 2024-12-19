export function routines(scope, initialRoutines?) {
    const routineComponents = [];

    function add(routine) {
        const r = routine(scope);
        routineComponents.push(r);
        return r.init();
    }

    function terminate() {
        return routineComponents.map(r => r.terminate());
    }

    if (initialRoutines && initialRoutines.length > 0) {
        initialRoutines.forEach(iR => add(iR));
    }

    return {add, terminate};
}
