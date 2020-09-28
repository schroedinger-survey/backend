export default abstract class AbstractEmail {
    protected receiver: string;
    protected subject: string;
    protected parameters: object;
    protected body: string;

    protected constructor(receiver: string, subject: string, parameters: object) {
        this.content = this.content.bind(this);
        this.receiver = receiver;
        this.subject = subject;
        this.parameters = parameters;
        this.body = this.content();
    }

    abstract content() : string;
}
