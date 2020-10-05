import rabbitmq from "../drivers/RabbitMQ";

export default abstract class AbstractMessageQueue {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    protected publish = async (queue: string, messages: Array<string>): Promise<void> => {
        return await rabbitmq.publish(queue, messages);
    }

    protected consume = async (queue: string, _consume: (message: string) => Promise<unknown>): Promise<any> => {
        return await rabbitmq.consume(queue, _consume);
    }
}