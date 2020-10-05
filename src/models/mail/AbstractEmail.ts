export default abstract class AbstractEmail {
    protected receiver: string;
    protected subject: string;
    protected parameters: Record<string, unknown>;
    protected body: string;

    protected constructor(receiver: string, subject: string, parameters: Record<string, unknown>) {
        this.content = this.content.bind(this);
        this.receiver = receiver;
        this.subject = subject;
        this.parameters = parameters;
    }

    abstract content(): string;

    serialize(): Record<string, string> {
        return {
            receiver: this.receiver,
            subject: this.subject,
            body: this.content()
        }
    }
}
