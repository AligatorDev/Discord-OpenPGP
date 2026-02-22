import {database} from "./storage.js"
import { isValidPgpKey,fastHash,normalize,encryptPublicKey,Encrypt,Decrypt, formatPGPMessage} from "./encryption.js";
import {typeInTextBox,isInDM,getCurrentChannelId, enableEncryption } from "./discord.js"

export const protocol = {
    PROTOCOL_START: "OPENPGP_",
    PUBLIC_KEY_DISCOVERY_RES: "KEY_RES",
    PUBLIC_KEY_DISCOVERY: "KEY_DISCOVERY",
    MESSAGE:"MESSAGE"
}

export async function onMessage(message,id) {
    if (!isInDM()) return message;
    if (message.startsWith(protocol.PUBLIC_KEY_DISCOVERY)) {
        let PgpKey = message.substring(protocol.PUBLIC_KEY_DISCOVERY.length);
        if (!(await isValidPgpKey(PgpKey))) return  ".: OPENPGP :. \n INVALID PUBLIC KEY \n .: OPENPGP :."
        if (normalize(PgpKey) == normalize(database.myKeyPair.public)) return ".: OPENPGP :. \n YOUR PUBLIC KEY \n .: OPENPGP :.";
        let currentchannelId = getCurrentChannelId();
        let contact = database.contacts.find(({channelid}) =>channelid == currentchannelId );
        if (contact) {
            return ".: OPENPGP :. \n OLD PARTNER PUBLIC KEY \n .: OPENPGP :.";
        } 
        if( database.rejectedKeys[fastHash(message)]) {
            return ".: OPENPGP :. \n REJECTED PARTNER PUBLIC KEY \n .: OPENPGP :.";
        }
        if (confirm(`This channel is wanting to handshake, do you accept that request?`)) {
            let encryptedMessage =await encryptPublicKey(database.myKeyPair.public,PgpKey);
            typeInTextBox(`${protocol.PROTOCOL_START}${protocol.PUBLIC_KEY_DISCOVERY_RES}${encryptedMessage}`)
            database.contacts.push({
                channelid:currentchannelId,
                pbkey:PgpKey,
                timestamp :new Intl.DateTimeFormat(undefined, {
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit'
                }).format(new Date())
            });
            enableEncryption(true)
            return ".: OPENPGP :. \n ACCEPTED PARTNER PUBLIC KEY \n .: OPENPGP :.";

        } 
        database.rejectedKeys[fastHash(message)]= {
            timestamp :new Intl.DateTimeFormat(undefined, {
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit'
            }).format(new Date()),
            channelid:currentchannelId
        };
        return ".: OPENPGP :. \n REJECTED PARTNER PUBLIC KEY \n .: OPENPGP :.";
    } else if (message.startsWith(protocol.PUBLIC_KEY_DISCOVERY_RES)) {
        let currentchannelId = getCurrentChannelId();
        let contact = database.contacts.find(({channelid}) =>channelid == currentchannelId  );
        if (contact) {
            return ".: OPENPGP :. \n OLD PUBLIC KEY RESPONSE \n .: OPENPGP :.";
        } 
        let msg = message.substring(protocol.PUBLIC_KEY_DISCOVERY_RES.length);

        let publicKey = await Decrypt(msg)
        if (!publicKey) {
            return ".: OPENPGP :. \n INVALID PUBLIC KEY RESPONSE \n .: OPENPGP :.";
        }
        if (!(await isValidPgpKey(publicKey))) return  ".: OPENPGP :. \n INVALID PUBLIC KEY RESPONSE \n .: OPENPGP :."

        database.contacts.push({
            channelid:currentchannelId,
            pbkey:publicKey,
            timestamp :new Intl.DateTimeFormat(undefined, {
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit'
            }).format(new Date())
        });
        enableEncryption(true)
        return ".: OPENPGP :. \n ACCEPTED PUBLIC KEY RESPONSE \n .: OPENPGP :.";
    } else if (message.startsWith(protocol.MESSAGE)) {
        let currentchannelId = getCurrentChannelId();
        let contact = database.contacts.find(({channelid}) =>channelid == currentchannelId  );
        if (!contact) {
            return ".: OPENPGP :. \n INVALID ENCRYPTED TEXT \n .: OPENPGP :.";
        } 
        let msg = formatPGPMessage(message.substring(protocol.MESSAGE.length));
        let realmsg = await Decrypt(msg)
        if (!realmsg) {
            return ".: OPENPGP :. \n INVALID ENCRYPTED TEXT \n .: OPENPGP :.";
        }
        return realmsg;
    } 
    return message;
}


export function sendPbKey() {

    
    typeInTextBox(`${protocol.PROTOCOL_START}${protocol.PUBLIC_KEY_DISCOVERY}${database.myKeyPair.public}`)

}