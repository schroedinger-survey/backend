import ErrorMessage from "./ErrorMessage";

export default class InvalidSubmissionError extends ErrorMessage{
    private readonly _humanMessage: string;
    private readonly _machineMessage: string;

    constructor(humanMessage: string, machineMessage: string = "The payload is not valid") {
        super();
        this._humanMessage = humanMessage;
        this._machineMessage = machineMessage;
    }

    explain(): string {
        return "The payload is not valid.";
    }

    humanMessage(): string {
        return this._machineMessage
    }

    id(): string {
        return "01EKPTBJXNA83TZCJG7Q0Y22CT";
    }

    machineMessage(): string {
        return this._humanMessage;
    }

    statusCode(): number {
        return 400;
    }

    when(): string {
        return "Creating submission";
    }

}