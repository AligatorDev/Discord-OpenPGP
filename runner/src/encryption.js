import * as openpgp from "openpgp";
import {database} from "./storage.js"
import {GetCurrentPassword} from "./discordMenu.js"
openpgp.config.clockDrift = 300000;


export async function ChangePrivateKeyEncryption(lastPassword, newPassword) {
    let privKeyObj = await openpgp.readKey({ 
        armoredKey: database.myKeyPair.private 
    });

    if (lastPassword != "") {
        privKeyObj = await openpgp.decryptKey({
            privateKey: privKeyObj,
            passphrase: lastPassword || "" 
        });
    }
    if (newPassword != "") {
        privKeyObj = await openpgp.encryptKey({
            privateKey: privKeyObj, 
            passphrase: newPassword || "" 
        });
    }
    database.myKeyPair.private = privKeyObj.armor(); 
}

export async function encryptPublicKey(myPbkey, PartnerPbkey) {
    const publicKeyParceiro = await openpgp.readKey({ armoredKey: PartnerPbkey });

    const mensagem = await openpgp.createMessage({ text: myPbkey });

    const criptografado = await openpgp.encrypt({
        message: mensagem,
        encryptionKeys: publicKeyParceiro,
    });

    return criptografado; 
}
export async function isValidPgpKey(armoredKey) {
    try {
        const key = await openpgp.readKey({ armoredKey });
        return true;  
    } catch (e) {
        return false; 
    }
}
export function formatPGPMessage(msgFormatada) {

    return msgFormatada.replaceAll(" ","\n").replace("-----BEGIN\nPGP\nMESSAGE-----","-----BEGIN PGP MESSAGE-----").replace("-----END\nPGP\nMESSAGE-----","-----END PGP MESSAGE-----");
    
}


export async function Decrypt(armoredMessage) {
    try {
        const message = await openpgp.readMessage({
            armoredMessage: armoredMessage 
        });
        let privKeyObj = await openpgp.readPrivateKey({ 
            armoredKey: database.myKeyPair.private 
        });
        let pass = (await GetCurrentPassword()) || '';
        if (pass  != "") {
            privKeyObj = await openpgp.decryptKey({
                privateKey: privKeyObj,
                passphrase: pass
            });
        }
        const { data: decrypted } = await openpgp.decrypt({
            message,
            decryptionKeys: privKeyObj ,
        });

        return decrypted; 
    } catch (error) {
  
        return;
    }
}
export async function Encrypt(plainText, recipientPublicKeyArmored) {
    try {
        const recipientKey = await openpgp.readKey({ armoredKey: recipientPublicKeyArmored });
        const myKey = await openpgp.readKey({ armoredKey: database.myKeyPair.public });
        const message = await openpgp.createMessage({ text: plainText });
        const armoredEncrypted = await openpgp.encrypt({
            message,
            encryptionKeys: [recipientKey, myKey] ,
        });

        return armoredEncrypted;
    } catch (error) {
        console.error(error);
        return "Error in encryption"; 
    }
}

export function fastHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; 
    }
    return hash.toString(16);
};

export function normalize(str) {
    return str.replace(
        /\n/,""
    ).replace(
        /\r/,""
    ).trim()
}

export  async function GeneratePGPKey() {
    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
        type: 'ecc', 
        curve: 'curve25519',
        userIDs: [{ name: 'John Doe', email: 'john@doe.com' }], 
        passphrase: (await GetCurrentPassword())  || "",
    }).catch(console.error);
    
    database.myKeyPair={
        public:publicKey,
        private:privateKey
    };

}