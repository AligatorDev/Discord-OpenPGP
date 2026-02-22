const sendHooks = [];

export function addXhrSendHook(urlSelector, callback) {
    sendHooks.push({ selector: urlSelector, cb: callback });
};
export function addXhrSendHookResponse(urlSelector, callback) {
    const meuHook = sendHooks.find(h => h.selector === urlSelector);
    meuHook.onResponse = callback;
};

export function init_hook() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        this._method = method;
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        const hook = sendHooks.find(h => this._url.includes(h.selector));

        if (hook) {
            const self = this;

  

            const originalOnReadyStateChange = self.onreadystatechange;
            self.onreadystatechange = function() {
                if (self.readyState === 4 && hook.onResponse) {
                    try {
                        const modifiedResponse = hook.onResponse(self.responseText, self._url);
                        
                        Object.defineProperty(self, 'responseText', { value: modifiedResponse });
                        Object.defineProperty(self, 'response', { value: modifiedResponse });
                    } catch (e) {
                        console.error( e);
                    }
                }
                if (originalOnReadyStateChange) return originalOnReadyStateChange.apply(this, arguments);
            };
          
            if (body) {
                (async () => {
                    try {
                        const modifiedBody = await hook.cb(body, self._url);
                        originalSend.call(self, modifiedBody);
                    } catch (e) {
                        console.error(e);
                        originalSend.call(self, body);
                    }
                })();
                return; 
            }
        }

        return originalSend.apply(this, arguments);
    };
}