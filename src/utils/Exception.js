const Exception = (statusCode, humanMessage, machineMessage) => {
    const obj = {};
    obj.statusCode = statusCode;
    obj.humanMessage = humanMessage;
    obj.machineMessage = machineMessage;


    obj.send = (res) => {
        const payload = {
            human_message: obj.humanMessage
        }
        if (this.machineMessage) {
            payload.machine_message = obj.machineMessage;
        }
        return res.status(obj.statusCode).send(payload)
    }
    return obj;
}

module.exports = Exception;