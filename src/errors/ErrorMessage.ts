export default abstract class ErrorMessage {
    abstract humanMessage() : string;

    abstract machineMessage() : string;

    abstract statusCode() : number;

    abstract id() : string;

    abstract explain(): string;

    abstract when() : string;

    serialize() : Record<string, unknown> {
        return {
            human_message: this.humanMessage(),
            machine_message: this.machineMessage(),
            status_code: this.statusCode(),
            id: this.id(),
            explain: this.explain(),
            when: this.when()
        }
    }
}