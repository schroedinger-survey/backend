import ErrorMessage from "./ErrorMessage";

export default class FalsePasswordError extends ErrorMessage{
    explain(): string {
        return "Password is wrong.";
    }

    humanMessage(): string {
        return "Password is wrong.";
    }

    id(): string {
        return "01EKPTENRT44MBYG8910VFH1CX";
    }

    machineMessage(): string {
        return "Password is wrong.";
    }

    statusCode(): number {
        return 403;
    }

    when(): string {
        return "Verifying old password";
    }

}