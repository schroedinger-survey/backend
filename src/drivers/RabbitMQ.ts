const amqplib = require("amqplib");

class RabbitMQ {
    private connection: any;
    private initialized = false

    initialize = async () => {
        if(!this.initialized) {
            this.connection = await amqplib.connect(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}?heartbeat=60`);
            this.initialized = true;
        }
    }

    publish = async (queue: string, messages: Array<string>, ttl = 2580000000, contentType = "application/json") => {
        await this.initialize();
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
        await this.initialize();
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
        await this.initialize();
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
        await this.initialize();
        const channel = await this.connection.createChannel();
        try {
            await channel.checkQueue(queue);
        }finally {
            await channel.close();
        }
        return true;
    }

    close = async () => {
        await this.initialize();
        await this.connection.close();
    }
}

const rabbitmq = new RabbitMQ();
export default rabbitmq;