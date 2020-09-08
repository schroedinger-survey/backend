class AbstractEmail {
    constructor(receiver, subject, parameters) {
        this.content = this.content.bind(this);
        this.receiver = receiver;
        this.subject = subject;
        this.parameters = parameters;
        this.body = this.content();
    }

    content() {
        throw Error("Not implemented");
    }
}

module.exports = AbstractEmail;