const config = require("./config");
const Gpio = require("onoff").Gpio;
const AtemController = require("./atemController");

const programLed = new Gpio(config.programGpio, 'out');
const previewLed = new Gpio(config.previewGpio, 'out');

let atemController = new AtemController();

atemController.on('camera_change', function() {
    programLed.write(0);
    previewLed.write(0);
    
    if(!this.previewSourceIds || !this.programSourceIds)
        return;
    
    if (this.programSourceIds.includes(config.camera)) {
        programLed.write(1);
    } else if (this.previewSourceIds.includes(config.camera)) {
        previewLed.write(1);
    }
});

atemController.on('connect', function() {
    programLed.write(0);
    previewLed.write(0);
    console.log('Connected ATEM at IP: %s', this.activeIp);
});

atemController.on('disconnect', function() {
    // try to reconnect
    console.log('Lost connect to ATEM at IP: %s', this.activeIp);

    atemController.selectDevice(config.atemIp);
});

const exitHandler = function(options, exitCode) {
    atemController.disconnectDevice();
    programLed.write(1);
    previewLed.write(1);
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

atemController.selectDevice(config.atemIp);