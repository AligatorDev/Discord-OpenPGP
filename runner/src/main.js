import {init_hook} from "./xml_hook.js"
import {StartDB,database} from "./storage.js"
import {} from "./discordMenu.js"
import {initDiscord} from "./discord.js"
import {GeneratePGPKey} from "./encryption.js"
import {} from "./protocol.js"
import {} from "./file_encryption.js"

async function main() {
    await init_hook();
    await StartDB();
    initDiscord();
    if(!database.myKeyPair) {
        GeneratePGPKey()
    }
    
}
if (window && !window.injected) {
    window.injected = true;

    main()
}








