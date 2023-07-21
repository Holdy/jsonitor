'use strict';

const fs   = require('fs');
const path = require('path');

function DiffEngine() {
}

DiffEngine.prototype.process = function(monitorInfo, data) {
    let result = false;
    if (Array.isArray(data)) {
        if (data.length === 0) {
            // If we have any snapshots - can say they're all gone.
            //TODO monitorInfo.monitor.raiseEvent(monitorinfo, null, 'all items dele')
            //delete snapshots.
        } else {
            data.forEach((item) => {
                let snapshotFileName = determineSnapshotFileName(monitorInfo, item);
                let snapshotData;
                if (fs.existsSync(snapshotFileName)) {
                    snapshotData = JSON.parse(fs.readFileSync(snapshotFileName));
                } 

                if (snapshotData) {
                    let diff = determineDifferences(monitorInfo, snapshotData, item);
                    if (diff.differences.length > 0) {
                        diff.differences.forEach((difference) => {
                            monitorInfo.monitor.raiseEvent(monitorInfo, item, difference);
                            result=true;
                        });
                    }  
                } else {
                    monitorInfo.monitor.raiseEvent(monitorInfo, item, 'initial snapshot');
                }
            
                fs.writeFileSync(snapshotFileName, JSON.stringify(item, null, 3));
            });
        }
    } else {
        throw new Error('Currently, only lists are supported');
    }
    return result;
}

function determineDifferences(monitorInfo, snapshot, latest) {
    
    if (snapshot.data && latest.data) {
        // we'll just process the data sub-object.
        return determineDifferences(monitorInfo, snapshot.data, latest.data);
    }

    let result = {differences:[]};

    Object.keys(latest).forEach((latestKey) => {

        if (!monitorInfo.ignoreKey(latestKey)) {
            let snapshotValue = snapshot[latestKey];
            let latestValue = latest[latestKey];
            if (snapshotValue === latestValue) {
                // Both the same - not interesting
            } else if (!snapshotValue && snapshotValue !== 0 && snapshotValue !== '') {
                result.differences.push(`[${latestKey}] set to ${latestValue}`);
            } else {
                // changed.
                result.differences.push(`[${latestKey}] changed to ${latestValue} (was ${snapshotValue})`);
            }
        }
    });

    return result;
}

function fileSafeName(text) {
    while (text.indexOf(':') !== -1) {
        text = text.replace(':', '[colon]');
    }

    while (text.indexOf('\\') !== -1) {
        text = text.replace('\\', '[bslash]');
    }

    while (text.indexOf('/') !== -1) {
        text = text.replace('/', '[fslash]');
    }

    return text;
}

function determineSnapshotFileName(monitorInfo, item) {
    let itemId = monitorInfo.idFor(item);
    let fileName = path.join(monitorInfo.monitor.getSnapshotBaseDirectory(), monitorInfo.typeName, fileSafeName(itemId) + '.json');
    return fileName;
}

module.exports = DiffEngine;