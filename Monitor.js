'use strict';

const fs = require('fs');
const path = require('path');
const MonitorInfo = require('./MonitorInfo');

function Monitor() {
}

Monitor.prototype.createMonitorInfo = function() {
    let result = new MonitorInfo();
    result.monitor = this;
    return result;
}

Monitor.prototype.setBaseDirectory = function(value) {
    this.baseDirectory = value;

    if (!fs.existsSync(this.getSnapshotBaseDirectory())) {
        fs.mkdirSync(this.getSnapshotBaseDirectory(), {recursive: true});
    }
    if (!fs.existsSync(this.getLogDirectory())) {
        fs.mkdirSync(this.getLogDirectory(), {recursive: true});
    }
}

Monitor.prototype.getSnapshotBaseDirectory = function() {
    return path.join(this.baseDirectory, 'snapshots');
}

Monitor.prototype.getLogDirectory = function() {
    return path.join(this.baseDirectory, 'log');
}

function pad(value) {
    return value.toString().padStart(2, 0);
}

function fileSafeName(text) {
    while (text.indexOf(':') != -1) {
        text = text.replace(':','[colon]');
    }

    while (text.indexOf('\\') != -1) {
        text = text.replace('\\', '[bslash]');
    }

    while (text.indexOf('/') != -1) {
        text = text.replace('/', '[fslash]');
    }


    return text;
}

Monitor.prototype.raiseEvent = function(monitorInfo, item, text) {
    let message =`${monitorInfo.descriptorFor(item)} - ${text}`;
    console.log(message);

    /*
    let timestamp = new Date();
    let timestampPrefix =  `${timestamp.getFullYear()}-${pad(timestamp.getMonth()+1)}-${pad(timestamp.getDate())} ${pad(timestamp.getHours())}${pad(timestamp.getMinutes())}${pad(timestamp.getSeconds())}`;
    let fileName = `${timestampPrefix} ${message}`;
    fs.writeFileSync(path.join(this.getLogDirectory(), fileSafeName(fileName)), '');
    */
}

module.exports = Monitor;