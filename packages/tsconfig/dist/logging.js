"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLogger = exports.getLogger = exports.log = void 0;
exports.log = console;
function getLogger(name) {
    return exports.log;
}
exports.getLogger = getLogger;
function setLogger(logger) {
    exports.log = logger;
}
exports.setLogger = setLogger;
