import ErrorMessage from "./ErrorMessage";

export default class EmailOrUsernameIsTakenError extends ErrorMessage{
    private readonly _machineMessage: string;
    private readonly _when: string;

    constructor(machineMessage: string, when: string) {
        super();
        this._machineMessage = machineMessage;
        this._when = when;
    }

    explain(): string {
        return "Email or user name is taken";
    }

    humanMessage(): string {
        return "Email or user name is taken";
    }

    id(): string {
        return "01EKPTEXHHZ5CHKGD3V4AVX678";
    }

    machineMessage(): string {
        return this._machineMessage;
    }

    statusCode(): number {
        return 409;
    }

    when(): string {
        return this._when;
    }

}