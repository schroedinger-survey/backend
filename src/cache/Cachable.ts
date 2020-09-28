import { Request, Response, NextFunction} from 'express';
class Cachable {
    /**
     * Begin handler of every request. Enable the caching layer.
     */
    initialize(req: Request, res: Response, next: NextFunction){
        req["schroedinger"] = {
            cache: {},
        };
        res["schroedinger"] = {
            cache: {},
        };
        return next();
    }

    /**
     * End handler of every request. Enable the SQL layer to hand off the responsibility to cache layer.
     * Since each cache layer must do a response to client, this handler will play the role of code reuse for
     * cache finalizing.
     *
     * In order for this handler to work. Each cacheable SQL layer must set `res.cache.response.status` at least.
     */
    finalize(req: Request, res: Response, next: NextFunction){
        if (res["schroedinger"].status && !res["schroedinger"].body) {
            return res.sendStatus(res["schroedinger"].status);
        }
        if (res["schroedinger"].status && res["schroedinger"].body) {
            return res.status(res["schroedinger"].status).send(res["schroedinger"].body);
        }
        return next();
    }
}

const cacheable = new Cachable();
export default cacheable;