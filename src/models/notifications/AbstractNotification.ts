export default abstract class AbstractNotification {
    abstract title(): string;

    abstract content(): string;

    serialize(): Record<string, string> {
        return {
            title: this.title(),
            content: this.content()
        }
    }
}