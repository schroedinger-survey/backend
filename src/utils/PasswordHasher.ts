const bcrypt = require("bcrypt");

class PasswordHasher {
    private rounds = Number(process.env.BCRYPT_ROUND);

    encrypt = async (password: string) => {
        return await bcrypt.hash(password, this.rounds);
    }

    validate = async (password: string, hash: string) => {
        return await bcrypt.compare(password, hash);
    }
}

const passwordHasher = new PasswordHasher();
export default passwordHasher;