import {createPackage,extractAll} from "@electron/asar"
import fs from "fs"
import path from "path"

const installationPath = path.join(process.env.LOCALAPPDATA,"DiscordEncryption");

export function isDir(path) {
    return fs.statSync(path).isDirectory()
}
export function checkDiscordInstallation(Path,retpath) {
    if(!fs.existsSync(Path) || !isDir(Path)) return false;
    let folders = fs.readdirSync(Path).filter((v)=>isDir(path.join(Path,v)));
    let app = folders.filter((v)=>v.startsWith("app-"));
    if (app.length == 0 || app.length > 1) return false;
    return fs.existsSync(path.join(Path,app[0],"Discord.exe")) ? (retpath ? path.join(Path,app[0]) : true ) :false;
}


export function checkInstalation() {
    return fs.existsSync(installationPath)
}
export function Install(Path,suppress) {
    if (fs.existsSync(path.join(Path,".discenc"))) {
        if (!suppress){
            console.log("You cannot re-install DiscordEncryption");
        }
        return;
    };

    if (!suppress){
        console.log("Installing DiscordEncryption");
        console.log(`Copying files to ${installationPath}`);
    }
    fs.mkdirSync(installationPath)
    fs.cpSync(".", installationPath, {recursive: true});

    if (!suppress){
        console.log(`Patching Discord App`);
    }
    let appPath = checkDiscordInstallation(Path,true);
    let solvedPath = path.join(appPath,"modules","discord_desktop_core-1","discord_desktop_core");
    let unpackPath = path.join(solvedPath,"core");
    let packPath = path.join(solvedPath,"core.asar");
    fs.copyFileSync(packPath,packPath+".bkp");
    extractAll(packPath,unpackPath);
    let filePath = path.join(solvedPath,"core","app","mainScreen.js");
    let fileData =fs.readFileSync(filePath).toString();
    fileData = fileData.replace(`mainWindow.setMenuBarVisibility(false);`,`
        mainWindow.setMenuBarVisibility(false);
        mainWindow.webContents.on('did-start-navigation',()=>{
            mainWindow.webContents.executeJavaScript(_fs.default.readFileSync(${JSON.stringify(path.resolve(installationPath,"runner.js"))}).toString())
        })
    `)
    fs.writeFileSync(filePath,fileData);
    createPackage(unpackPath,packPath).then(()=>{
        fs.rmSync(unpackPath,{recursive:true,force:true});
        fs.writeFileSync(path.join(Path,".discenc"),"")
        if (!suppress) { 
            console.log(`DiscordEncryption installed, now you can re-open your discord client!`);
        }
    })
    
}

export function Uninstall(Path,suppress) {
    if (!fs.existsSync(path.join(Path,".discenc"))) {
        if (!suppress){
            console.log("DiscordEncryption isnt installed");
        }
        return;
    };    
    if (!suppress){
        console.log("Uninstalling DiscordEncryption");

        console.log(`Restoring discord`);
    }
    let appPath = checkDiscordInstallation(Path,true);
    let solvedPath = path.join(appPath,"modules","discord_desktop_core-1","discord_desktop_core");
    let packPath = path.join(solvedPath,"core.asar");
    if (fs.existsSync(packPath+".bkp")) { 
        fs.rmSync(packPath,{force:true})
        fs.renameSync(packPath+".bkp",packPath);
    }
    console.log(`Removing ${installationPath} folder`);
    fs.rmSync(installationPath,{recursive:true,force:true});
    fs.rmSync(path.join(Path,".discenc"))

    if (!suppress) { 
        console.log(`DiscordEncryption uninstalled`);

    }
}