import ErrorMessage from "./ErrorMessage";

export default class EmailOrUsernameIsExpectedError extends ErrorMessage{
    private readonly _when: string;

    constructor(when: string) {
        super();
        this._when = when;
    }

    explain(): string {
        return "Email or user name is taken";
    }

    humanMessage(): string {
        return "Email or user name is taken";
    }

    id(): string {
        return "01EKPTFC59YZ9VFAZQ3402JRF0";
    }

    machineMessage(): string {
        return "Email or user name is taken";
    }

    statusCode(): number {
        return 400;
    }

    when(): string {
        return this._when;
    }

}