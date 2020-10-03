import ErrorMessage from "./ErrorMessage";

export default class SurveyNotFoundError extends ErrorMessage{
    private readonly _machineMessage: string;
    private readonly _when: string;

    constructor(machineMessage = "The database can not found the survey.", when = "Retrieving survey.") {
        super();
        this._machineMessage = machineMessage;
        this._when = when;
    }

    explain(): string {
        return "The database can not found the survey.";
    }

    humanMessage(): string {
        return "The specified survey can not be found. Please try again, later.";
    }

    id(): string {
        return "59b59552-2002-47b0-a739-e75fe6fee2b7";
    }

    machineMessage(): string {
        return this._machineMessage;
    }

    statusCode(): number {
        return 404;
    }

    when(): string {
        return this._when;
    }

}