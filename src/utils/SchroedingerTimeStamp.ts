export default class SchroedingerTimeStamp{
    static currentUTCMsTimeStamp() : number{
        const date = new Date(new Date().getTime());
        date.getTimezoneOffset();
        return new Date(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            date.getUTCMilliseconds()
        ).getTime();
    }

    static currentUTCDate() : Date{
        const date = new Date(new Date().getTime());
        date.getTimezoneOffset();
        return new Date(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            date.getUTCMilliseconds()
        );
    }

    static msTimeStampToDate(timestamp: number) : Date{
        return new Date(timestamp);
    }
}