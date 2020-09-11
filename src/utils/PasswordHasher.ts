const bcrypt = require("bcrypt");

class PasswordHasher {
    private rounds = Number(process.env.BCRYPT_ROUND);

    encrypt = async (password) => {
        return await bcrypt.hash(password, this.rounds);
    }

    validate = async (password, hash) => {
        return await bcrypt.compare(password, hash);
    }
}

const passwordHasher = new PasswordHasher();
export default passwordHasher;