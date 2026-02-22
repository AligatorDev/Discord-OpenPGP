import {sendPbKey, onMessage, protocol } from "./protocol.js";
import {addXhrSendHook} from "./xml_hook.js"
import {database} from "./storage.js"
import { Encrypt, fastHash } from "./encryption.js";

export function getCurrentChannelId() {
    return window.location.href.replace("https://discord.com/channels/@me/","");
}
export function isInDM() {
    return window.location.href.startsWith("https://discord.com/channels/@me/") &&   !(document.querySelector(`[data-list-item-id*="${ getCurrentChannelId()}"]`)?.innerHTML?.includes("https://cdn.discordapp.com/channel-icons/"))
}


export function markMessageAsEncrypted(messageId) {
    document.getElementById(`message-content-${messageId}`).style["background-color"] = "RGBA(255,255,255,0.02)";
}




export function clearTextBoxOneByOne(editor2) {
    const editor = editor2 || document.querySelector('div[data-slate-editor="true"]');
    if (!editor) return console.error("editor not found!");
    console.log(editor2)
    editor.focus();
    let textLength = editor.textContent.length;

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false); 
    selection.removeAllRanges();
    selection.addRange(range);

    for (let i = 0; i < textLength*2; i++) {

        const inputEvent = new InputEvent('beforeinput', {
            inputType: 'deleteContentBackward',
            bubbles: true,
            cancelable: true
        });

        editor.dispatchEvent(inputEvent);

        if (!inputEvent.defaultPrevented) {
            document.execCommand('deleteContentBackward', false, null);
        }

        editor.dispatchEvent(new Event('input', { bubbles: true }));
    
    }
}
export async function typeInTextBox(texto,element,notsend) {
    clearTextBoxOneByOne(element)
    const editor = element || document.querySelector('div[data-slate-editor="true"]');
    if (!editor) return 

    editor.focus();

    for (const char of texto) {
        
        const inputEvent = new InputEvent('beforeinput', {
            data: char,
            inputType: 'insertText',
            bubbles: true,
            cancelable: true
        });

        editor.dispatchEvent(inputEvent);
        if (!inputEvent.defaultPrevented) {
            document.execCommand('insertText', false, char);
        }

    }
    if (!notsend) { 
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        });
        editor.dispatchEvent(event)
    }

}


let msgCache = new Map();

export function clearMessageCache() {
    msgCache = new Map();
}
let ENCRYPTMESSAGES = false;
function renderLock(url) {
    if (!isInDM() || document.getElementById("encryptionstatus")) {return}
    let currentchannelId = getCurrentChannelId()
    ENCRYPTMESSAGES = database.contacts.find(({channelid})=>channelid==currentchannelId);
    const chatBar = document.querySelector('div[class*="channelBottomBarArea"]');
    const buttons = chatBar ? chatBar.querySelector('div[class*="buttons_"]') : null;

    if (buttons) {
        const lock = document.createElement('div');
        lock.id = "encryptionstatus";
        lock.innerText = ENCRYPTMESSAGES ? '🔒' : "🔓";
        Object.assign(lock.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',    
            width: '32px',          
            height: '32px',
            cursor: 'pointer',
            fontSize: '18px',
            position: 'relative',  
            order: '-1',            
            flexShrink: '0',        
            margin: '0 0px',  
            maxWidth: '32px', 
            flexGrow: '0',    
            userSelect: 'none',
            textAlign: "center",
            lineHeight: "32px",
            marginRight: "auto"
        });

        lock.onclick = clickLockItem;

        buttons.prepend(lock);
    }
}


function clickLockItem() {
    let currentchannelId = getCurrentChannelId();
    if (!ENCRYPTMESSAGES && !database.contacts.find(({channelid})=>channelid==currentchannelId)) {
        if(confirm("You dont have the pgp key of that channel. Confirm to init the handshake")) {
            sendPbKey()
        }
        return;

    }
    ENCRYPTMESSAGES = !ENCRYPTMESSAGES;
    let lock = document.getElementById("encryptionstatus");
    lock.innerHTML = ENCRYPTMESSAGES ? '🔒' : "🔓";

}

export function enableEncryption(bool) {
    ENCRYPTMESSAGES = bool;
    let lock = document.getElementById("encryptionstatus");
    lock.innerHTML = ENCRYPTMESSAGES ? '🔒' : "🔓";
}


async function start_decrypt(id, text, element) {

    try {
        const res = await onMessage(text,id);
        msgCache.set(id, res);
        if (element && document.contains(element)) {
            element.innerText = res;
        }
    } catch (e) {
        console.error( e,text);
    }
}
function clearPgpTrash(tx) {
    let txt= tx.replace(/[^A-Za-z0-9+/=]/g, '');
    return txt;
}
function ProcessEditor(rootNode) {

    const editor = rootNode.querySelector ? rootNode.querySelector('[role="textbox"][data-slate-editor="true"]') : null;

    if (editor) {
        if (editor.dataset.processed === "true") return;
            const textoNoEditor = editor.innerText;
            const hash = fastHash(clearPgpTrash(textoNoEditor));
            if (msgCache.has(hash)) {
                const decryptedText = msgCache.get(hash);
                editor.dataset.processed = "true";
                editor.focus();
                typeInTextBox(decryptedText,editor,true);
            } 
            
            
    }
}
function ProcessNodes(rootNode) {
    const contentEls = rootNode.querySelectorAll ? rootNode.querySelectorAll('[class*="messageContent"]') : [];
    contentEls.forEach(contentEl => {
        const messageContainer = contentEl.closest('[id^="chat-messages-"]');
        if (!messageContainer) return;
        const msgId = messageContainer.id.replace('chat-messages-', '');
        const messageEl = contentEl.querySelector("span") || messageContainer;
        const texto = messageEl .innerText;
        if (texto.startsWith(protocol.PROTOCOL_START)) {
            const hash = fastHash(clearPgpTrash(texto))

            if (msgCache.has(hash)) {
                if (messageEl .innerText !== msgCache.get(hash)) {
                    messageEl .innerText = msgCache.get(hash);
                }
            } else {
                messageEl .innerText = "🔓 [Decrypting...]";
                start_decrypt(hash, texto.substring(protocol.PROTOCOL_START.length), messageEl );
            }
            markMessageAsEncrypted(msgId.split("-")[1])
        }
    });
}
let lastObserver;
function StartListening() {
    if (lastObserver) lastObserver.disconnect();
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    ProcessNodes(node);
                    ProcessEditor(node);
                }
            });
            if (mutation.target.nodeType === 1) {
                ProcessEditor(mutation.target);
                ProcessNodes(mutation.target);

            }
            if (mutation.type === 'childList') {
                ProcessNodes(mutation.target);
                ProcessEditor(mutation.target);
            }
        }
        
    });
    observer.observe(document.body, { childList: true, subtree: true });
    lastObserver = observer;
    ProcessNodes(document.body);
    ProcessEditor(document.body);
}
export function initDiscord() {
    StartListening();
    let lastUrl = location.href;

    const waitChat = setInterval(() => {
        const chatBar = document.querySelector('div[class*="channelBottomBarArea"]');
        if (chatBar) {
            renderLock(location.href); 
            clearInterval(waitChat);
        }
    }, 500);
    renderLock(lastUrl); 

    const observer = new MutationObserver(() => {

        if (location.href !== lastUrl) {
            lastUrl = location.href;
            renderLock(lastUrl); 
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}









addXhrSendHook('/messages', async (body, url) => {
    let data = JSON.parse(body);
    const regex = /channels\/(\d+)(?:\/messages\/(\d+))?/;
    const [_,channelId,messageId] = url.match(regex);
    if (data.content && isInDM() && ENCRYPTMESSAGES && !data.content.startsWith(protocol.PROTOCOL_START)) {
        let currentchannelId = getCurrentChannelId();
        if (channelId == currentchannelId) {
            let contact  = database.contacts.find(({channelid}) =>channelid == currentchannelId );
            if (contact) {
                const encrypted = await Encrypt(data.content,contact.pbkey);
                let decripted = data.content
                data.content = `${protocol.PROTOCOL_START}${protocol.MESSAGE}${encrypted}`;
                if (messageId) {
                    let sc = document.getElementById(`message-content-${messageId}`);
                    setTimeout(()=>{(sc.querySelector("span") || sc).innerText=decripted},100)
                }
            }

        }
    }
    return JSON.stringify(data);
});