'use strict'

const events = require('events').EventEmitter;
const util = require('util');
const { Atem } = require('atem-connection');
const AtemExtPortType = require('atem-connection').Enums.ExternalPortType;
util.inherits(AtemController, events);

module.exports = AtemController;

function AtemController() {
    var self = this;

    events.EventEmitter.call(self);
    self.activeatem = new Atem({ externalLog: console.log });
    self.activeip = '';
    self.availableCameras = [];
    self.previewSourceIds = [];
    self.programSourceIds = [];

    self.activeatem.on('connected', function() {});

    self.activeatem.on('stateChanged', function(state, path) {
        var previewEnabled = [];
        var programEnabled = [];
        switch (path) {
            case 'reconnect':
                self.onAtemDisconnection();
                break;
            case 'info':
                self.onAtemConnection();

                // Repopulate camera list
                var inputs = self.activeatem.state.inputs;
                self.availableCameras = new Array();

                if (inputs) {
                    Object.keys(inputs).forEach(function(key) {
                        var input = inputs[key];
                        if (input.isExternal && input.internalPortType == 0) {
                            self.availableCameras["SID_" + input.inputId] = {
                                id: input.inputId,
                                name: input.longName,
                                abbreviation: input.shortName,
                                interface: AtemExtPortType[input.externalPortType]
                            }
                        }

                    });

                    console.log('info');
                    console.log('cameras: %s', self.availableCameras);
                    self.emit('update_cameras');
                }

            default:
                if (path.split('.')[0] != 'info') {
                    console.log("path: '%s'", path);
                    //console.log(state.info);
                    //console.log(state.inputs);
                }

                if ((path.split('.')[0] == 'video' || (path == 'info' && self.activeatem.state.inputs)) && state.video.ME[0]) {
                    console.log(state.video.ME);

                    if (state.video.ME[0].inTransition) {
                        programEnabled.push(state.video.ME[0].programInput);
                        programEnabled.push(state.video.ME[0].previewInput);

                        Object.keys(state.video.ME).forEach(function(meKey) {
                            Object.keys(state.video.ME[meKey].upstreamKeyers).forEach(function(kKey) {
                                if (state.video.ME[meKey].transitionProperties.selection & (1 << (kKey + 1)) || state.video.ME[meKey].upstreamKeyers[kKey].onAir)
                                    programEnabled.push(state.video.ME[meKey].upstreamKeyers[kKey].fillSource);
                            })
                        });
                    } else {
                        previewEnabled.push(state.video.ME[0].previewInput);
                        programEnabled.push(state.video.ME[0].programInput);

                        Object.keys(state.video.ME).forEach(function(meKey) {
                            Object.keys(state.video.ME[meKey].upstreamKeyers).forEach(function(kKey) {
                                if (state.video.ME[meKey].upstreamKeyers[kKey].onAir)
                                    programEnabled.push(state.video.ME[meKey].upstreamKeyers[kKey].fillSource);
                            })
                        });
                    }

                    Object.keys(state.video.ME).forEach(function(meKey) {
                        for (var i = 1; i < 4; i++) {
                            if (state.video.ME[meKey].transitionProperties.selection & (1 << i) && state.video.ME[meKey].upstreamKeyers[i - 1]) {
                                previewEnabled.push(state.video.ME[meKey].upstreamKeyers[i - 1].fillSource);
                            }
                        }
                    });

                    Object.keys(state.video.downstreamKeyers).forEach(function(dsKey) {
                        if (state.video.downstreamKeyers[dsKey] && (state.video.downstreamKeyers[dsKey].onAir || state.video.downstreamKeyers[dsKey].inTransition))
                            programEnabled.push(state.video.downstreamKeyers[dsKey].sources.fillSource);
                    });

                    previewEnabled.push(state.video.ME[0].previewInput);
                    programEnabled.push(state.video.ME[0].programInput);

                    self.onAtemPreviewChange(previewEnabled);
                    self.onAtemProgramChange(programEnabled);
                }

                break;
        }
    });

    self.activeatem.on('disconnected', function() {
        self.onAtemDisconnection();
    });

    return this.activedevice;
}

AtemController.prototype.selectDevice = function(ip) {
    var self = this;

    self.activeip = ip;
    self.activeatem.connect(ip);
}

AtemController.prototype.disconnectDevice = function() {
    var self = this;
    console.log("Clearing cameras");
    self.availableCameras = [];
    self.activeatem.disconnect();
}

AtemController.prototype.getAtemDeviceType = function(sourceId) {
    var self = this;
    self.activeatem.getSourceInfio(sourceId).type;
}

AtemController.prototype.onAtemConnection = function() {
    var self = this;
    self.emit('connect');
}

AtemController.prototype.onAtemDisconnection = function() {
    var self = this;
    self.emit('disconnect');
    self.previewSourceIds = [];
    self.programSourceIds = [];
    self.availableCameras = [];
}

AtemController.prototype.onAtemPreviewChange = function(sourceIds) {
    var self = this;
    console.log("Preview changed to ");
    console.log(sourceIds);
    self.previewSourceIds = sourceIds;

    self.emit('preview_change');
    self.onAtemAllChanges();
}

AtemController.prototype.onAtemProgramChange = function(sourceIds) {
    var self = this;
    console.log("Program changed to ");
    console.log(sourceIds);
    self.programSourceIds = sourceIds;

    self.emit('program_change');
    self.onAtemAllChanges();
}

AtemController.prototype.onAtemAllChanges = function() {
    var self = this;

    self.emit('camera_change');
}