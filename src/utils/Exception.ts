import { Response} from 'express';

const exception = (res: Response, statusCode: number, humanMessage: string, machineMessage: string=null) => {
    const payload = {
        human_message: humanMessage
    }
    if (machineMessage) {
        payload['machine_message'] = machineMessage;
    }
    return res.status(statusCode).send(payload)
}

export default exception;