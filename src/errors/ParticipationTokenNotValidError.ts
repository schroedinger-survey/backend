import ErrorMessage from "./ErrorMessage";

export default class ParticipationTokenNotValidError extends ErrorMessage{
    private readonly _machineMessage: string;
    private readonly _when: string;

    constructor(machineMessage: string, when: string) {
        super();
        this._machineMessage = machineMessage;
        this._when = when;
    }
    explain(): string {
        return "The participation token is not valid.";
    }

    humanMessage(): string {
        return "You are not allowed to access this resource.";
    }

    id(): string {
        return "01EKPTDDF7XESFX8VVDQRYW5HD";
    }

    machineMessage(): string {
        return this._machineMessage;
    }

    statusCode(): number {
        return 403;
    }

    when(): string {
        return this._when;
    }

}