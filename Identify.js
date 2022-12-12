const config = require("./config");
const Gpio = require("onoff").Gpio;

const programLed = new Gpio(config.programGpio, 'out');
const previewLed = new Gpio(config.previewGpio, 'out');

programLed.write(0);
previewLed.write(1);
setTimeout(() => { programLed.write(1); previewLed.write(0); }, 250);
setTimeout(() => { programLed.write(0); previewLed.write(1); }, 500);
setTimeout(() => { programLed.write(1); previewLed.write(0); }, 750);
setTimeout(() => { programLed.write(0); previewLed.write(1); }, 1000);
setTimeout(() => { programLed.write(1); previewLed.write(0); }, 1250);
setTimeout(() => { programLed.write(0); previewLed.write(1); }, 1500);
setTimeout(() => { programLed.write(1); previewLed.write(0); }, 1750);
setTimeout(() => { programLed.write(0); previewLed.write(0); }, 2000);
setTimeout(() => { process.exit(); }, 2250);