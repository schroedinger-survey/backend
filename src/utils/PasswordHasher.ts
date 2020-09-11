const bcrypt = require("bcrypt");

class PasswordHasher {
    private rounds = 1;

    encrypt = async (password) => {
        return await bcrypt.hash(password, this.rounds);
    }

    validate = async (hash, password) => {
        return await bcrypt.validate(password, hash);
    }
}

const passwordHasher = new PasswordHasher();
export default passwordHasher;