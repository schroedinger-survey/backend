import ErrorMessage from "./ErrorMessage";

export default class NoAccessToSurveyError extends ErrorMessage{
    private _machineMessage: string;

    constructor(machineMessage: string) {
        super();
        this._machineMessage = machineMessage;
    }

    explain(): string {
        return "User does not have access to the survey.";
    }

    humanMessage(): string {
        return "User does not have access to the survey.";
    }

    id(): string {
        return "01EKPTDKQX5F1ENXJVTD57F0KH";
    }

    machineMessage(): string {
        return this._machineMessage;
    }

    statusCode(): number {
        return 403;
    }

    when(): string {
        return "Retrieve survey.";
    }

}