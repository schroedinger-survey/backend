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
        this.body = this.content();
    }

    abstract content() : string;
}
