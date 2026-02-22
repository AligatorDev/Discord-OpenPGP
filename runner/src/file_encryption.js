import { addXhrSendHook, addXhrSendHookResponse } from "./xml_hook";
import { Encrypt } from "./encryption";
import { database } from "./storage";






/* 

TODO, SUPPORT FILE ENCRYPTION


addXhrSendHook('/attachments', async (body, url) => {
    console.log("req",body)

    let data = JSON.parse(body);
    const regex = /channels\/(\d+)/;
    const [_,channelId] = url.match(regex);
    if (data.content && isInDM() && ENCRYPTMESSAGES && !data.content.startsWith(protocol.PROTOCOL_START)) {
        let currentchannelId = getCurrentChannelId();
        if (channelId == currentchannelId) {
            let contact  = database.contacts.find(({channelid}) =>channelid == currentchannelId );
            if (contact) {
                for (let file of files) {

                }
            }

        }
    }
    return JSON.stringify(data);
});

addXhrSendHookResponse("/attachments",async(body,url)=>{

    console.log("res", body)

    return body
}) */