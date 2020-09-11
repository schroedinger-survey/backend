const bcrypt = require("bcrypt");

class PasswordHasher {
    private rounds = Number(process.env.BCRYPT_ROUND);

    encrypt = async (password) => {
        return await bcrypt.hash(password, this.rounds);
    }

    validate = async (hash, password) => {
        return await bcrypt.compare(hash, password);
    }
}

const passwordHasher = new PasswordHasher();
export default passwordHasher;