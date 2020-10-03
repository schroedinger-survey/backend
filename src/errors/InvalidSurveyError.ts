import ErrorMessage from "./ErrorMessage";

export default class InvalidSurveyError extends ErrorMessage{
    explain(): string {
        return "The survey is empty.";
    }

    humanMessage(): string {
        return "The survey is empty.";
    }

    id(): string {
        return "01EKPTEEHTYABEEBJ7GQW86XHB";
    }

    machineMessage(): string {
        return "The survey is empty.";
    }

    statusCode(): number {
        return 400;
    }

    when(): string {
        return "Creating survey.";
    }

}