import { createDecipheriv, createHash } from "crypto";
import fs from "fs";

export function descifrarMensaje(textToDecrypt) {
  if (!textToDecrypt) {
    return "";
  }

  const key = claveEncripcion("KEY");
  const IV = claveEncripcion("IV");

  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(key, "base64"), Buffer.from(IV, "base64"));
  let decrypted = decipher.update(textToDecrypt, "base64", "utf-8");
  decrypted += decipher.final("utf-8");

  return decrypted;
}

function claveEncripcion(tipo) {
  if (tipo === "KEY") {
    return "vYzIWDYOoOi/0JYWzmsJ+T8Ahui+ijT1ecUr5M6sXKo=";
  } else {
    return "xhw7fC1jkS3/dqT+rhUJNg==";
  }
}

export function calculateHash(filePath, algorithm = "sha256") {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = createHash(algorithm);
  hash.update(fileBuffer);
  return hash.digest("base64");
}
