import ErrorMessage from "./ErrorMessage";

export default class ResetPasswordLinkNotFoundError extends ErrorMessage{
    explain(): string {
        return "Reset password link not found in database.";
    }

    humanMessage(): string {
        return "You are not allowed to execute this operation.";
    }

    id(): string {
        return "01EKPTD768WPDM2MV0MM85T4YJ";
    }

    machineMessage(): string {
        return "Reset password link not found in database.";
    }

    statusCode(): number {
        return 400;
    }

    when(): string {
        return "Reset password";
    }

}