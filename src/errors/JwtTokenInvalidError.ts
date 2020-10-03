import ErrorMessage from "./ErrorMessage";

export default class JwtTokenInvalidError extends ErrorMessage{
    private readonly _machineMessage: string;
    private readonly _when: string;


    constructor(machineMessage: string, when: string) {
        super();
        this._machineMessage = machineMessage;
        this._when = when;
    }

    explain(): string {
        return "The JWT token is either not valid any more or is blacklisted.";
    }

    humanMessage(): string {
        return "Your session is expired. Please logout and login again.";
    }

    id(): string {
        return "01EKPTE7W0QB4KYY0DHTBMQ5P1";
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