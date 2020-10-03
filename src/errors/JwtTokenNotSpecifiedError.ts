import ErrorMessage from "./ErrorMessage";

export default class JwtTokenNotSpecifiedError extends ErrorMessage{
    explain(): string {
        return "Header authorization is empty or not specified.";
    }

    humanMessage(): string {
        return "Your session can not be identified. You are not allowed to access this resource.";
    }

    id(): string {
        return "01EKPTE0VW3B0GDN6Q85JCD45E";
    }

    machineMessage(): string {
        return "Header authorization is empty or not specified.";
    }

    statusCode(): number {
        return 403;
    }

    when(): string {
        return "Validating JWT.";
    }

}