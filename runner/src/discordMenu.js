import {sendPbKey, onMessage, protocol } from "./protocol.js";
import {addXhrSendHook} from "./xml_hook.js"
import {database} from "./storage.js"
import { Encrypt, ChangePrivateKeyEncryption } from "./encryption.js";
import Swal from 'sweetalert2';
import {clearMessageCache} from "./discord.js"

let password;
const focusShielder = (e) => {
    const isSwalVisible = !!document.querySelector('.swal2-container');
    
    if (isSwalVisible && e.target && !e.target.closest('.swal2-container')) {
        e.stopImmediatePropagation();
        e.preventDefault();
        
        const swalInput = document.querySelector('.swal2-input, .swal2-file, .swal2-textarea, .swal2-select');
        if (swalInput) {
            swalInput.focus();
        }
    }
};

async function prompt(data, def) {
    const keyHandler = (e) => {
        if (document.querySelector('.swal2-container')) {
            e.stopPropagation();
        }
    };
    window.focus()

    const { value: password } = await Swal.fire({
        title: data,
        input: 'password',
        background: '#313338',
        color: '#dbdee1',
        confirmButtonColor: '#5865f2',
        target: document.body,
        allowOutsideClick: false, 
        didOpen: () => {
            const input = Swal.getInput();
            if (input) setTimeout(() => input.focus(), 50); 
        },
        willOpen: () => {
            document.addEventListener('focus', focusShielder, true);
            document.addEventListener('keydown', keyHandler, true);
        },
        willClose: () => {
            document.removeEventListener('focus', focusShielder, true);
            document.removeEventListener('keydown', keyHandler, true);
            const editor = document.querySelector('div[data-slate-editor="true"]');
            if (editor) editor.focus();
        }
    });

    return password !== undefined ? password : def;
}

const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
};
const reg = /[&<>"'/]/ig;
    
export function sanitizeForHtml(rawKey) {
    return raw.replace(reg, (match) => map[match]);
}



export async function GetCurrentPassword() {
    if (database.requirePassword && !password) {
        password = await prompt("Write your password to decrypt your pvkey:");
        clearMessageCache();
    }
    return password
}
function menuController(container) {
    const css = `
        #discord-keys-root {
            --dark-main: #313338;
            --dark-elevated: #2b2d31;
            --dark-header: #1e1f22;
            --text-normal: #dbdee1;
            --text-muted: #949ba4;
            --brand-color: #5865f2;
            --brand-hover: #4752c4;
            --danger: #fa777c;
            --border: #3f4147;
            --success: #23a559;
            font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: var(--dark-main);
            color: var(--text-normal);
            padding: 16px;
            border-radius: 8px;
        }

        /* Container de botões de ação */
        .action-bar {
            display: flex;
            gap: 10px;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border);
        }

        .btn-discord {
            background-color: var(--brand-color);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .btn-discord:hover {
            background-color: var(--brand-hover);
        }

        .btn-discord.secondary {
            background-color: #4e5058;
        }

        .btn-discord.secondary:hover {
            background-color: #6d6f78;
        }

        .table-title {
            font-size: 12px;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            margin: 20px 0 8px 8px;
        }

        .discord-grid {
            display: grid;
            grid-template-columns: 100px 1fr 150px 50px;
            gap: 1px;
            background-color: var(--border);
            border: 1px solid var(--border);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 20px;
        }

        .grid-header {
            background-color: var(--dark-header);
            color: var(--text-muted);
            font-size: 11px;
            font-weight: 600;
            padding: 10px 15px;
            text-transform: uppercase;
        }

        .grid-cell {
            background-color: var(--dark-elevated);
            padding: 12px 15px;
            font-size: 13px;
            display: flex;
            align-items: center;
            border-bottom: 1px solid var(--border);
        }

        .key-mono {
            font-family: 'Consolas', monospace;
            color: var(--brand-color);
            background: rgba(88, 101, 242, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            text-overflow: ellipsis;
            overflow: hidden;
        }

        .btn-remove {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 18px;
            transition: color 0.2s;
            display: flex;
            justify-content: center;
            width: 100%;
        }

        .btn-remove:hover { color: var(--danger); }
    `;

    if (!document.getElementById("menuStyleOpenpgp")) {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = css;
        styleSheet.id = "menuStyleOpenpgp";
        document.head.appendChild(styleSheet);
    }

   

    container.innerHTML = `<div id="discord-keys-root"></div>`;
    const root = container.querySelector('#discord-keys-root');

    function render() {
        root.innerHTML = `

            <div class="action-bar">
                <button class="btn-discord" id="btn-create-pass">Create/Change pass</button>
                <button class="btn-discord secondary" id="btn-export-config">Export</button>
                <button class="btn-discord secondary" id="btn-import-config">Import</button>
            </div>

            <div class="table-title">Public Keys</div>
            <div class="discord-grid" data-type="contacts">
                <div class="grid-header">Channel ID</div>
                <div class="grid-header">Public Key</div>
                <div class="grid-header">Date</div>
                <div class="grid-header"></div>
                ${database.contacts.map((item, index) => `
                    <div class="grid-cell" style="font-weight:600">${item.channelid}</div>
                    <div class="grid-cell"><span class="key-mono">${sanitizeForHtml(item.pbkey)}</span></div>
                    <div class="grid-cell" style="color:var(--text-muted)">${item.timestamp || '-'}</div>
                    <div class="grid-cell">
                        <button class="btn-remove-contacts btn-remove" data-type="contacts" data-idx="${index}">×</button>
                    </div>
                `).join('')}
            </div>

            <div class="table-title">Rejected Keys</div>
            <div class="discord-grid" data-type="rejectedKeys">
                <div class="grid-header">ID</div>
                <div class="grid-header">Public Key Hash</div>
                <div class="grid-header">Date</div>
                <div class="grid-header"></div>
                ${Object.keys(database.rejectedKeys).map((item, index) =>{
                    let value = database.rejectedKeys[item];
                    return (`
                    <div class="grid-cell" style="font-weight:600">${value.channelid}</div>
                    <div class="grid-cell" style="color:var(--danger)">${item}</div>
                    <div class="grid-cell" style="color:var(--text-muted)">${value.timestamp || '-'}</div>
                    <div class="grid-cell">
                        <button class="btn-remove-rejected btn-remove" data-type="rejectedKeys" data-idx="${item}">×</button>
                    </div>
                `)}).join('')}
            </div>

        `;
        document.getElementById("btn-create-pass").onclick= async function () {
            let lastPassword = await GetCurrentPassword();
            let newPassword = await prompt(`Write your password ${(lastPassword || "") == "" ? "" : "(leave blank to remove)"}`,"");
            database.requirePassword = !(newPassword == "");
            if(!database.requirePassword) {
                password=null;
            }
            await ChangePrivateKeyEncryption(lastPassword || "",newPassword || "");
            
        }
        document.getElementById("btn-import-config").onclick= async function () {
            let data = await prompt("Import config json");
            if (data) {
                try {
                    let ns = JSON.parse(data);
                    Object.assign(database,ns);
                    alert(
                        "Config updated!"
                    )
                } catch
                {}
            }
            
        }
        document.getElementById("btn-export-config").onclick= async function () {
            await navigator.clipboard.writeText(JSON.stringify(database));
            alert(
                "Config writed to your clipboard!"
            )
        }
    }
  
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-contacts')) {
            const { type, idx } = e.target.dataset;
            database[type].splice(idx, 1);
            render();
        }
        if (e.target.classList.contains('btn-remove-rejected')) {
            const { type, idx } = e.target.dataset;
            delete database[type][idx];
            render();
        }
    });

    render();
}





function renderConfigPage() {
    document.querySelector('[class*="breadcrumbText"]').innerText = 'Encryption configuration';
    menuController(document.querySelector('[data-settings-panel-scroller="true"]'))

}



function renderMenu() {    
    if (document.getElementById("config_disc_pgp")) return;

    let adv = document.querySelector('[data-settings-sidebar-item="advanced_panel"]');
    adv.insertAdjacentHTML("afterend",`
<div id = "config_disc_pgp" data-settings-sidebar-item="encryption_config" class="itemContainer_caf372" >
<div class="item_caf372" role="listitem" data-list-item-id="settings-sidebar___advanced_sidebar_item" tabindex="-1">
    <div class="itemContent_caf372">
        <svg class="icon_caf372" aria-hidden="true" role="img"
            xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M7 10.0288C7.47142 10 8.05259 10 8.8 10H15.2C15.9474 10 16.5286 10 17 10.0288M7 10.0288C6.41168 10.0647 5.99429 10.1455 5.63803 10.327C5.07354 10.6146 4.6146 11.0735 4.32698 11.638C4 12.2798 4 13.1198 4 14.8V16.2C4 17.8802 4 18.7202 4.32698 19.362C4.6146 19.9265 5.07354 20.3854 5.63803 20.673C6.27976 21 7.11984 21 8.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V14.8C20 13.1198 20 12.2798 19.673 11.638C19.3854 11.0735 18.9265 10.6146 18.362 10.327C18.0057 10.1455 17.5883 10.0647 17 10.0288M7 10.0288V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10.0288" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="text-md/medium_cf4812" data-text-variant="text-md/medium" style="color: currentcolor;">Encryption configuration</div>
    </div>
</div>
</div>`);
    document.getElementById("config_disc_pgp").onclick=renderConfigPage
}


function waitAndClickSettings() {
    const observer = new MutationObserver((mutations, obs) => {
        const userArea = document.querySelector('section[aria-label]') || 
        document.querySelector('nav[class*="container_"]')?.parentElement;
        if (!userArea) return;
        const buttons = userArea.querySelectorAll('button');
        const settingsBtn = buttons[buttons.length - 1];
        if (!settingsBtn) return;
        settingsBtn.addEventListener('click', ()=>{
            setTimeout(()=>{
                renderMenu()
            },200)
        });
        observer.disconnect();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

waitAndClickSettings();