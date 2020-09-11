export default abstract class AbstractEmail {
    protected receiver;
    protected subject;
    protected parameters;
    protected body;

    protected constructor(receiver, subject, parameters) {
        this.content = this.content.bind(this);
        this.receiver = receiver;
        this.subject = subject;
        this.parameters = parameters;
        this.body = this.content();
    }

    abstract content() : string;
}
