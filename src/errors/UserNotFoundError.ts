import ErrorMessage from "./ErrorMessage";

export default class UserNotFoundError extends ErrorMessage{
    explain(): string {
        return "User not found.";
    }

    humanMessage(): string {
        return "User not found.";
    }

    id(): string {
        return "01EKPTCSFB71EQ8J5FE2QCG58G";
    }

    machineMessage(): string {
        return "User not found.";
    }

    statusCode(): number {
        return 404;
    }

    when(): string {
        return "Retrieve user";
    }

}