const DB_NAME = "OPENPGP_VAULT";
const STORE_NAME = "vault";
const DB_VERSION = 1;

async function accessIDB(mode, callback) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(STORE_NAME, mode);
            const store = tx.objectStore(STORE_NAME);
            
            const opRequest = callback(store);

            opRequest.onsuccess = () => {
                const result = opRequest.result; 
                db.close();
                resolve(result);
            };

            opRequest.onerror = () => {
                db.close();
                reject(opRequest.error);
            };
        };

        request.onerror = (e) => reject(e.target.error);
    });
}

export async function createPersistentStorage(key, initialData = {}) {
    let savedData = null;
    try {
        savedData = await accessIDB("readonly", (store) => store.get(key));
    } catch (err) {}

    const rootTarget = savedData || JSON.parse(JSON.stringify(initialData));

    const save = () => {
        const cleanData = JSON.parse(JSON.stringify(rootTarget));
        accessIDB("readwrite", (store) => store.put(cleanData, key))
            .catch(err => console.error(err));
    };

    const createHandler = () => ({
        get(target, prop) {
            const value = Reflect.get(target, prop);
            if (value !== null && typeof value === 'object') {
                return new Proxy(value, createHandler());
            }
            return value;
        },
        set(target, prop, value) {
            const result = Reflect.set(target, prop, value);
            save();
            return result;
        },
        deleteProperty(target, prop) {
            const result = Reflect.deleteProperty(target, prop);
            save(); 
            return result;
        }
    });

    return new Proxy(rootTarget, createHandler());
}
export let database;

export async function StartDB() {
    const data = await createPersistentStorage("crypto_v1", {
        rejectedKeys:{},
        contacts:[]
    });
    database=data;
}