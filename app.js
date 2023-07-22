"use strict";

const GeoBox = require("./GeoBox");
const erm = require("./erm");

const Monitor = require("./Monitor");
const DiffEngine = require("./DiffEngine");

const FASTEST_POLL_SPEED = 1;
const SLOWEST_POLL_SPEED = 15;

const geoBoxes = [
  new GeoBox(
    "work-building",
    "52.628759, 1.302008",
    "52.628809, 1.302414",
    "52.628973, 1.302225",
    "52.628682, 1.302226"
  ),
  new GeoBox(
    "home",
    "52.650202, 1.367452",
    "52.650121, 1.367726",
    "52.649977, 1.367416",
    "52.650101, 1.367304"
  ),
  new GeoBox(
    "village",
    "52.654391, 1.368849",
    "52.651193, 1.373584",
    "52.648036, 1.366595",
    "52.651702, 1.362688"
  ),
];

async function processAutoScheduledItem(data) {
  //   console.log('processing');
  let differenceFound = await data.handlerFunction();

  if (differenceFound && data.secondsBetweenPoll > FASTEST_POLL_SPEED) {
    data.secondsBetweenPoll = FASTEST_POLL_SPEED;
    //       console.log('Found changes so setting poll to: ' + FASTEST_POLL_SPEED);
  } else if (!differenceFound) {
    let newPoll;
    if (data.secondsBetweenPoll < 10) {
      newPoll = Math.min(SLOWEST_POLL_SPEED, data.secondsBetweenPoll + 1);
    } else if (data.secondsBetweenPoll < 30) {
      newPoll = Math.min(SLOWEST_POLL_SPEED, data.secondsBetweenPoll + 5);
    } else {
      newPoll = Math.min(SLOWEST_POLL_SPEED, data.secondsBetweenPoll + 10);
    }
    if (newPoll !== data.secondsBetweenPoll) {
      //    console.log('increasing poll to: ' + newPoll);
      data.secondsBetweenPoll = newPoll;
    }
  }

  setTimeout(() => {
    processAutoScheduledItem(data);
  }, data.secondsBetweenPoll * 1000);
}

function autoSchedule(handlerFunction) {
  let data = {
    handlerFunction: handlerFunction,
    secondsBetweenPoll: 15,
  };
  processAutoScheduledItem(data);
}

let monitor = new Monitor();
monitor.setBaseDirectory("c:/monitor");

let monitorInfoChris = monitor
  .createMonitorInfo()
  .setTypeName("phone-data")
  .setForcedId("chris")
  .ignoreKeys(["t", "phone.wifiinfo", "phone.battery-percentage"]);

let diffEngine = new DiffEngine();

//let memoryMonitorInfo = monitor.createMonitorInfo().setTypeName('meta').setForcedId('monitor');

//let ec2InstancesAwsTest = monitor.createMonitorInfo().setTypeName('aws-test-ec2-instances').setIdKey('name').ignoreKeys(['startTime']);

//let cxBatchedMonitor = monitor.createMonitorInfo().setTypeName('aws-test-cxbatched').setIdKey('Key');

/*
    autoSchedule(async () => {
        let heap_mb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        let data = {
            'heap-size-mb':heap_mb
        };
        return diffEngine.process(memoryMonitorInfo, [data]);
    });
    */

/*
autoSchedule(async () => {
    let text = await require('./commandExecutor').executeAsync('node c:/projects/swiss/erm/erm list ec2 instances with Purple in the name');
    let rawJson = JSON.parse(text);
    let cleanJson = rawJson.map(item => item.value);
    return diffEngine.process(ec2InstancesAwsTest, cleanJson);
    });

autoSchedule(async () => {
    let text = await require('./commandExecutor').executeAsync('aws s3api  list-objects --bucket purpleaa13 --prefix cxbatched/2019');
    let rawJson = JSON.parse(text);
    return diffEngine.process(cxBatchedMonitor, rawJson.Contents.map((item) => { item.Owner = null; return item; }));
});

autoSchedule(async () => {
    let text = await require('./commandExecutor').executeAsync('node c:/projects/swiss/erm/erm list ec2 instances with purple in the name');
    let rawJson = JSON.parse(text);
    let cleanJson = rawJson.map(item => item.value);
    return diffEngine.process(ec2InstancesAwsTest, cleanJson);
});
*/

let defaultLaptop = {
  set_ms: Date.now(),
  data: { state: "unknown" },
}; // Useful default state as - if this code is starting up, it's probably been manually triggered.

let latestState = null;
let previousData;
let slackApiToken = process.env["SLACK_API_KEY"];
let slackApiToken2 = process.env["SLACK_API_KEY_2"];
let commandExecutor = require("./commandExecutor");
let lastKnownLocation;

function processNewData(keyvalData) {
  const data = keyvalData["chris-phone"].data;
  if (!data) {
    return;
  }
  const laptop = keyvalData["chris-laptop"].data ?? defaultLaptop;
  /*
    if (workPcData && workPcData.data && workPcData.data.state === 'unknown') {
        return;
    }

    if (laptop && laptop.data && laptop.data.state === 'unknown') {
        return;
    }
    */

  let time = new Date();
  let phoneOrientation = data["phone.orientation"];
  let wifiLoc = data["phone.wifiloc"];
  let bluetooth = data["phone.bluetooth"];

  let locationType;
  if (wifiLoc === "SessionCam") {
    locationType = "office";
  } else if (wifiLoc === "At home") {
    locationType = "home";
  }

  if (locationType) {
    lastKnownLocation = locationType;
  }

  let suggestedState;

  if (callInProgress(data)) {
    suggestedState = "talking_on_a_mobile_phone";
  } else if (locationType === "office" && phoneOrientation === "upside down") {
    suggestedState = "walking";
  } else if (workPcActive() && !laptopActive()) {
    // if the laptop was active, would be remoted in.
    suggestedState = "working_on_a_desktop_pc.office";
  } else if (laptopActive() && locationType === "home") {
    suggestedState = "working_on_a_laptop.home";
  } else if (bluetooth && bluetooth.startsWith("car-bluetooth")) {
    suggestedState = "driving_a_car";
  } else if (
    stepsIncreasing(data) &&
    dogWalkTime(time) &&
    !locationType &&
    lastKnownLocation === "home"
  ) {
    // walking, at dog-walking time, not at home, but was at home.
    suggestedState = "walking_a_dog";
  } else if (phoneOrientation === "upside down") {
    suggestedState = "walking";
  } else if (phoneOrientation !== "upside down" && locationType === "office") {
    if (atAComputer() || !latestState) {
      suggestedState = "working_on_a_desktop_pc.office";
    } else {
      suggestedState = "sitting_at_an_office_table";
    }
  } else if (
    passivePhonePosition(data) &&
    locationType === "home" &&
    !atAComputer()
  ) {
    suggestedState = "sitting_on_a_sofa.home";
  }

  // at-home - at-a-computer
  // at-home phone-standing-up (lying down - with phone)
  // at-home phone-passive-position (sitting)

  if (suggestedState && latestState !== suggestedState) {
    if (data["phone.locn"]) {
      geoBoxes.forEach((box) => {
        if (box.contains(data["phone.locn"])) {
          console.log("Phone location within geobox:" + box.label);
        }
      });
    }

    console.log(`Updating state to '${suggestedState}' was (${latestState})`);

    updateState(suggestedState);
  }
  previousData = data;
}

function passivePhonePosition(data) {
  let value = data["phone.orientation"];
  return value === "face down" || value === "face up" || value === "on side";
}

function callInProgress(data) {
  return data["phone.call-in-progress"];
}
function dogWalkTime(time) {
  return time.getHours() <= 8 || time.getHours() >= 18;
}

function workPcActive() {
  if (
    workPcData &&
    workPcData.data &&
    timestampIsRecent(workPcData.set_ms) &&
    workPcData.data.state === "unlocked"
  ) {
    return true;
  }
}

function laptopActive() {
  if (
    laptop &&
    laptop.data &&
    timestampIsRecent(laptop.set_ms) &&
    laptop.data.state === "unlocked"
  ) {
    return true;
  }
}
function atAComputer(time) {
  return laptopActive() || workPcActive();
}

function timestampIsRecent(timestamp) {
  let msDelta = Date.now() - timestamp;
  let minutesDelta = msDelta / 1000 / 60;

  return minutesDelta < 6;
}

function stepsIncreasing(data) {
  try {
    return previousData && data["phone.steps"] > previousData["phone.steps"];
  } catch (e) {
    return false;
  }
}

function updateState(newState) {
  latestState = newState;

  let image = "c:\\data\\profile\\" + newState + ".jpg";

  let slackCurl = `curl https://slack.com/api/users.setPhoto -F "image=@${image}" -F "token=${slackApiToken}`;
  commandExecutor.executeAsync(slackCurl);

  if (slackApiToken2) {
    slackCurl = `curl https://slack.com/api/users.setPhoto -F "image=@${image}" -F "token=${slackApiToken2}`;
    commandExecutor.executeAsync(slackCurl);
  }
}
