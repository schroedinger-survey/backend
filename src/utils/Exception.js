const exception = (res, statusCode, humanMessage, machineMessage) => {
    const obj = {};
    obj.statusCode = statusCode;
    obj.humanMessage = humanMessage;
    obj.machineMessage = machineMessage;
    const payload = {
        human_message: obj.humanMessage
    }
    if (this.machineMessage) {
        payload.machine_message = obj.machineMessage;
    }
    return res.status(obj.statusCode).send(payload)
}

module.exports = exception;