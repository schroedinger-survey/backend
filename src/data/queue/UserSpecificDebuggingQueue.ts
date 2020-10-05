import AbstractMessageQueue from "./AbstractMessageQueue";

class UserSpecificDebuggingQueue extends AbstractMessageQueue {
    consumeUserSpecificDebuggingNotification = async (userId: string, _consume: (message: string) => Promise<unknown>) : Promise<any>  => {
        return await this.consume(`debug_${userId}`, _consume);
    }
}

const userSpecificDebuggingQueue = new UserSpecificDebuggingQueue();
export default userSpecificDebuggingQueue;