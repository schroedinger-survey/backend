import ErrorMessage from "./ErrorMessage";

export default class SurveyAlreadyHaveSubmissionError extends ErrorMessage{
    explain(): string {
        return "Survey has more than 0 submission. Can not change survey any more.";
    }

    humanMessage(): string {
        return "Survey has more than 0 submission. Can not change survey any more.";
    }

    id(): string {
        return "01EKPTD02CCP14Y87TA82Q17QF";
    }

    machineMessage(): string {
        return "Survey has more than 0 submission. Can not change survey any more.";
    }

    statusCode(): number {
        return 400;
    }

    when(): string {
        return "Updating survey";
    }

}