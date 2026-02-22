import inquirer from 'inquirer';
import {checkInstalation,Install,Uninstall,checkDiscordInstallation} from "./installer.js"
import path from "path"
import chalk from "chalk"

async function mainMenu() {

    if (process.platform != 'win32') { 
        console.log("Currently we only windows machines are supported!")
        return;
    }
    console.log(chalk.green(`
  ___ ___ ___  ___ ___  ___ ___                   
 |   \_ _/ __|/ __/ _ \| _ \   \                  
 | |) | |\__ \ (_| (_) |   / |) |                 
 |___/___|___/\___\___/|_|_\___/___ ___ ___  _  _ 
 | __| \| |/ __| _ \ \ / / _ \_   _|_ _/ _ \| \| |
 | _|| .' | (__|   /\ V /|  _/ | |  | | (_) | .' |
 |___|_|\_|\___|_|_\ |_| |_|   |_| |___\___/|_|\_|
                                                  
                                                  `))
    const { option } = await inquirer.prompt([
        {
        type: 'list',
        name: 'option',
        message: 'Choose an option:',
        choices: [ !checkInstalation() ? 'Install' : 'Uninstall', 'Exit']
        }
    ]);

    switch (option) {
        case 'Install':
            ChooseMenu(true)
            break;

        case 'Uninstall':
            ChooseMenu()
            break;

        case 'Exit':
            process.exit(0);
            break;
    }

}




let discordCommonFolder;
if (process.platform === 'win32') {
    discordCommonFolder = [
        `${process.env.LOCALAPPDATA}\\Discord`  // By default win discord lives into %localappdata%/Discord
    ]
} 





function searchDiscordInstallations() {
    return discordCommonFolder.filter((path)=>checkDiscordInstallation(path));
}


async function ChooseMenu(install) { // for user
    const { option } = await inquirer.prompt([
        {
        type: 'list',
        name: 'option',
        message: 'Choose an discord installation: ',
        choices: [...searchDiscordInstallations(), 'Custom']
        }
    ]);
    if (option == 'Custom') {
        const { filePath } = await inquirer.prompt([
            {
              type: 'input',
              name: 'filePath',
              message: 'Where is you discord application (put the Discord root path):',
              validate: (input) => {
                return checkDiscordInstallation(input) ? true : 'Discord application wasnt found in that path!';
              }
            }
          ]);
        (install ? Install : Uninstall)(path.resolve(filePath))
    } else {
        (install ? Install : Uninstall)(path.resolve(option));
    }
}







mainMenu();
