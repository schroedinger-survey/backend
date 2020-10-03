import ErrorMessage from "./ErrorMessage";

export default class AuthenticationError extends ErrorMessage{
    private readonly _machineMessage: string;
    private readonly _when: string;

    constructor(machineMessage: string, when: string) {
        super();
        this._machineMessage = machineMessage;
        this._when = when;
    }

    explain(): string {
        return "An unknown problem happened while verifying user.";
    }

    humanMessage(): string {
        return "An unknown problem happened while verifying user.";
    }

    id(): string {
        return "01EKPTFJT2M0S2YE9BJ3SFD78E";
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