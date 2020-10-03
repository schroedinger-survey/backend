import ErrorMessage from "./ErrorMessage";

export class UnknownError extends ErrorMessage {
    private readonly _machineMessage: string;
    private readonly _when: string;

    constructor(machineMessage: string, when: string) {
        super();
        this._machineMessage = machineMessage;
        this._when = when;
    }

    when(): string {
        return this._when;
    }

    explain(): string {
        return "The database returns undefined behavior.";
    }

    humanMessage(): string {
        return "An unknown error just happened to us. Please try it again.";
    }

    id(): string {
        return "01EKPTC8R3E1Z7PTBP62879ZBB";
    }

    machineMessage(): string {
        return this._machineMessage;
    }

    statusCode(): number {
        return 500;
    }
}