import ErrorMessage from "./ErrorMessage";

export default class SubmissionNotFound extends ErrorMessage{
    explain(): string {
        return "Can not find submission.";
    }

    humanMessage(): string {
        return "Can not find submission.";
    }

    id(): string {
        return "01EKPTSYYXF1KBXT2M1NJKBTR6";
    }

    machineMessage(): string {
        return "Can not find submission.";
    }

    statusCode(): number {
        return 404;
    }

    when(): string {
        return "Retrieve submission.";
    }

}