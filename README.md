# 🔐 Discord OpenPGP Implementation

A PGP encryption layer for Discord, implemented via using openpgp.js. This project ensures that your messages are encrypted locally before reaching Discord's servers and seamlessly decrypted upon arrival.

## 🚀 Core Features

* **Seamless DM encryption**: All messages on direct messages channels are **End-to-End Encrypted (E2EE)**.
* **Public key database**: Public keys of all handshaked users are stored locally on your device, ensuring **no eavesdropper** can intercept your communication.
* **Private Key Protection**: Your private key is the core of your privacy; a password creation is available to secure it.
* **Import/Export Configuration**: Easily export or import your settings to use existing private keys or sync configurations across multiple devices.
* **Full Browser Support**: The script operates within the Discord browser sandbox, making it easy to run as an extension.

## 🛠️ Installation

### Windows

#### Installing

To install, ensure Node.js is installed, run npm install and run the start.bat script.

#### Building the injected script
To build install bun and run the **build.bat** script  
(The build version of the project is on runner.js)

#### Copying the Runner
To move the runner script to the extension directory, run **mount_extension.bat**, then ZIP the folder to import it into your preferred browser.



## ⚠️ Pending & Work in Progress (TODO)

- [ ] **Max Length bypass**: Encrypted messages are larger than plaintext; need a way to handle Discord's character limits.
- [ ] **File Encryption**: Extend hooks to intercept and encrypt file uploads/attachments.
- [ ] **Update persistence**: Ensure the script persists or auto-reinstalls after a Discord update.
- [ ] **Group Support**: Currently, only DMs are supported.
- [ ] **Improved Interception**: Move away from HTML DOM manipulation to fix issues with embeds, emojis, and hyperlinks.

## 🤝 How to Contribute

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Feel free to check the Issues page to help with the current TODO list!

## ⚖️ License

This project is licensed under the **Apache License 2.0**.
