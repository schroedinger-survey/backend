import ErrorMessage from "./ErrorMessage";

export class JwtTokenOrTokenNotSpecifiedError extends ErrorMessage{
    explain(): string {
        return "The JWT token and the participation token is invalid or not specified.";
    }

    humanMessage(): string {
        return "You are not allowed to access this survey.";
    }

    id(): string {
        return "01EKPTDT2B9F0V1BQM3RJ7MR89";
    }

    machineMessage(): string {
        return "JWT token and participation are not specified.";
    }

    statusCode(): number {
        return 403;
    }

    when(): string {
        return "Validating JWT and participation token.";
    }

}