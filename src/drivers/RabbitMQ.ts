const amqplib = require("amqplib");

class RabbitMQ {
    private connection: any;

    constructor() {
        this.createClient().catch(() => {
            process.exit(1);
        });
    }

    createClient = async () => {
        this.connection = await amqplib.connect(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}?heartbeat=60`);
    }

    publish = async (queue: string, messages: Array<string>, ttl = 2580000000, contentType = "application/json") => {
        const channel = await this.connection.createChannel();
        await channel.assertQueue(queue, {
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: {
                messageTtl: 2580000000,
                expires: 2580000000,
                maxLength: 100
            }
        });
        try {
            for (const message of messages) {
                await channel.sendToQueue(queue, Buffer.from(message), {
                    persistent: true,
                    contentType: contentType,
                    expiration: ttl
                });
            }
        }finally {
            await channel.close();
        }
    }

    consume = async (queue: string, _consume: (message: string) => Promise<void>) => {
        const channel = await this.connection.createChannel();
        channel.consume(queue, async function (message) {
            const mail = message.content.toString();
            try {
                await _consume(mail);
                await channel.ack(message);
            } catch (e) {
                await channel.nack(message, true);
            }
        }, {noAck: false});
        return channel;
    }

    assertQueue = async (queue: string): Promise<boolean> => {
        const channel = await this.connection.createChannel();
        try {
            await channel.assertQueue(queue, {
                durable: false,
                exclusive: false,
                autoDelete: true,
                arguments: {
                    messageTtl: 0,
                    expires: 0,
                    maxLength: 0
                }
            });
        }finally {
            await channel.close();
        }
        return true;
    }

    checkQueue = async (queue: string): Promise<boolean> => {
        const channel = await this.connection.createChannel();
        try {
            await channel.checkQueue(queue);
        }finally {
            await channel.close();
        }
        return true;
    }

    close = async () => {
        await this.connection.close();
    }
}

const rabbitmq = new RabbitMQ();
export default rabbitmq;