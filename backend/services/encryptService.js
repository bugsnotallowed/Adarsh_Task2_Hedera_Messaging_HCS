const crypto = require("crypto");

const secret = process.env.AES_SECRET_KEY;

module.exports = {
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-ctr", Buffer.from(secret), iv);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return iv.toString("hex") + ":" + encrypted.toString("hex");
  },

  decrypt(hash) {
    const parts = hash.split(":");
    const iv = Buffer.from(parts.shift(), "hex");
    const encryptedText = Buffer.from(parts.join(":"), "hex");

    const decipher = crypto.createDecipheriv("aes-256-ctr", Buffer.from(secret), iv);

    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
  }
};
