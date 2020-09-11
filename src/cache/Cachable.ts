class Cachable {
    /**
     * Begin handler of every request. Enable the caching layer.
     */
    initialize(req, res, next){
        req.cache = {
            read: {},
            write: {},
            request: {}
        };
        res.cache = {
            read: {},
            write: {},
            response: {}
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
    finalize(req, res, next){
        if (res.cache.response.status && !res.cache.response.body) {
            return res.sendStatus(res.cache.response.status);
        }
        if (res.cache.response.status && res.cache.response.body) {
            return res.status(res.cache.response.status).send(res.cache.response.body);
        }
        return next();
    }
}

const cacheable = new Cachable();
export default cacheable;