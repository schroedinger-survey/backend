const exception = (res, statusCode, humanMessage, machineMessage=null) => {
    const payload = {
        human_message: humanMessage
    }
    if (machineMessage) {
        payload['machine_message'] = machineMessage;
    }
    return res.status(statusCode).send(payload)
}

export default exception;