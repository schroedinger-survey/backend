import ErrorMessage from "./ErrorMessage";

export default class ParticipationLinkInvalidError extends ErrorMessage{
    private readonly _machineMessage: string;

    constructor(machineMessage: string) {
        super();
        this._machineMessage = machineMessage;
    }
    explain(): string {
        return "The link is not valid.";
    }

    humanMessage(): string {
        return "The link is not valid.";
    }

    id(): string {
        return "01EKPTP5SX5Y1EAHFNQQGEBK3Q";
    }

    machineMessage(): string {
        return this._machineMessage;
    }

    statusCode(): number {
        return 403;
    }

    when(): string {
        return "Creating submission";
    }

}