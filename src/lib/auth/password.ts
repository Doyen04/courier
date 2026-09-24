import argon2, { type HashOptions } from "argon2";
import { randomBytes } from "node:crypto";

const argonOptions: HashOptions = {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
};

// Used to keep unknown-email sign-ins close to the same work as a real check.
const dummyHash = argon2.hash(randomBytes(32).toString("base64"), argonOptions);

export function hashPassword(password: string) {
    return argon2.hash(password, argonOptions);
}

export async function verifyPassword(passwordHash: string | null, password: string) {
    if (!passwordHash) {
        await argon2.verify(await dummyHash, password).catch(() => false);
        return false;
    }

    return argon2.verify(passwordHash, password).catch(() => false);
}
