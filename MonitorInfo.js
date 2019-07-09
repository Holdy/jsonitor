'use strict';

const fs = require('fs');
const path = require('path');

function MonitorInfo() {

}
MonitorInfo.prototype.setForcedId = function(value) {
    this.forcedId = value;
    return this;
}

MonitorInfo.prototype.ignoreKeys = function (value) {
    this.ignoreKeysList = value;
    return this;
}

MonitorInfo.prototype.ignoreKey = function (key) {
    if (this.ignoreKeysList) {
        this.ignoreKeysList.forEach((item) => {
            if (item == key) {
                return true;
            }
        });
    } 

    return false;
}


MonitorInfo.prototype.setTypeName = function(value) {
    this.typeName = value;
    let typeDirectory = path.join(this.monitor.getSnapshotBaseDirectory(), this.typeName);

    if (!fs.existsSync(typeDirectory)) {
        fs.mkdirSync(typeDirectory, {recursive: true});
    }
    return this;
}

MonitorInfo.prototype.setIdKey = function (value) {

    this.idKey = value;
    return this;
}


MonitorInfo.prototype.idFor = function(item) {
    if (this.forcedId) {
        return this.forcedId;
    }
    return this.idKey ? item[this.idKey] : 'instance';
}

MonitorInfo.prototype.descriptorFor = function(item) {
    return `${this.typeName}@${this.idFor(item)}`;
}


module.exports = MonitorInfo;