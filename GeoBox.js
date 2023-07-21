'use strict';

function GeoBox() {
    this.minimumLatitude  =  1000;
    this.maximumLatitude  = -1000;
    this.minimumLongitude =  1000;
    this.maximumLongitude = -1000;
    this.label = arguments[0];

    for (let i = 1; i < arguments.length; i++) {
        let point = stringToLatLong(arguments[i]);
        if (point.latitude  < this.minimumLatitude ) this.minimumLatitude  = point.latitude;
        if (point.latitude  > this.maximumLatitude ) this.maximumLatitude  = point.latitude;
        if (point.longitude < this.minimumLongitude) this.minimumLongitude = point.longitude;
        if (point.longitude > this.maximumLongitude) this.maximumLongitude = point.longitude;
    }
}

function stringToLatLong(text) {
    let parts = text.split(',');
    return {
        latitude: Number(parts[0].trim()),
        longitude: Number(parts[1].trim())
    };
}

GeoBox.prototype.contains = function (stringOrLatitude, optionalLongitude) {
    if (typeof stringOrLatitude === 'string') {
        let point = stringToLatLong(stringOrLatitude);
        return point.latitude >= this.minimumLatitude &&
            point.latitude <= this.maximumLatitude &&
            point.longitude >= this.minimumLongitude &&
            point.longitude <= this.maximumLongitude;
    } else {
        throw new Error('Numeric lat,long not implemented');
    }
};

module.exports = GeoBox;