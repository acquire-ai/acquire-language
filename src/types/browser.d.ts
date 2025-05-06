declare global {
    interface Window {
        browser: {
            storage: {
                local: {
                    get: any;
                    set: any;
                };
            };
        };
    }
}

export {};
