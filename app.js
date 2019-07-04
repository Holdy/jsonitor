'use strict';

const erm = require('./erm');

const Monitor     = require('./Monitor');
const DiffEngine  = require('./DiffEngine');

async function processAutoScheduledItem(data) {
 //   console.log('processing');
    let differenceFound = await data.handlerFunction();

    if (differenceFound && data.secondsBetweenPoll > 5) {
        data.secondsBetweenPoll = 5;
 //       console.log('Found changes so setting poll to: 5');
    } else if (!differenceFound) {
        let newPoll = Math.min(120, data.secondsBetweenPoll + 10);
        if (newPoll != data.secondsBetweenPoll) {
 //           console.log('increasing poll to: ' + newPoll);
            data.secondsBetweenPoll = newPoll;
        }
    }

    setTimeout(() => {processAutoScheduledItem(data);}, data.secondsBetweenPoll * 1000);
}

function autoSchedule(handlerFunction) {
    let data ={
        handlerFunction: handlerFunction,
        secondsBetweenPoll: 15
    };
    processAutoScheduledItem(data);
}


    let monitor = new Monitor();
    monitor.setBaseDirectory('c:/monitor');

    let monitorInfoChris = monitor.createMonitorInfo().setTypeName('phone-data').setForcedId('chris');
    let monitorInfoLilly = monitor.createMonitorInfo().setTypeName('phone-data').setForcedId('lilly');

    let diffEngine = new DiffEngine();

    let memoryMonitorInfo = monitor.createMonitorInfo().setTypeName('meta').setForcedId('monitor');

autoSchedule(async () => {
    let heap_mb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    let data = {
        'heap-size-mb':heap_mb
    };
    return diffEngine.process(memoryMonitorInfo, [data]);
});

    autoSchedule(async () => {
        var json = await erm.getAsync('https://zzz.herokuapp.com/keyval/get/chris');
        return diffEngine.process(monitorInfoChris, [json]);
    });

    autoSchedule(async () => {
        var json = await erm.getAsync('https://zzz.herokuapp.com/keyval/get/lilly');
        return diffEngine.process(monitorInfoLilly, [json]);
    });


