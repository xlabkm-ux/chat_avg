export namespace litellm {
    let name: string;
    let adapter: string;
    let endpoint_url: any;
    let api_key: any;
    let extra_params: {};
    let models: {
        "gpt-4o": {
            name: string;
            extra_params: {};
        };
        "gpt-4o-mini": {
            name: string;
            extra_params: {};
        };
        "gpt-4.1": {
            name: string;
            extra_params: {};
        };
        "deepseek-chat": {
            name: string;
            extra_params: {};
        };
        "deepseek-reasoner": {
            name: string;
            extra_params: {};
        };
        "gemini-2.5-flash": {
            name: string;
            extra_params: {};
        };
        "gemini-2.5-pro": {
            name: string;
            extra_params: {};
        };
        "qwen-plus": {
            name: string;
            extra_params: {};
        };
        "grok-3": {
            name: string;
            extra_params: {};
        };
    };
}
export namespace llamacpp {
    let name_1: string;
    export { name_1 as name };
    let adapter_1: string;
    export { adapter_1 as adapter };
    let endpoint_url_1: string;
    export { endpoint_url_1 as endpoint_url };
    let api_key_1: string;
    export { api_key_1 as api_key };
    let extra_params_1: {};
    export { extra_params_1 as extra_params };
    export namespace models_1 {
        namespace _default {
            let name_2: string;
            export { name_2 as name };
            let extra_params_2: {};
            export { extra_params_2 as extra_params };
        }
        export { _default as default };
    }
    export { models_1 as models };
}
export namespace openai {
    let name_3: string;
    export { name_3 as name };
    let adapter_2: string;
    export { adapter_2 as adapter };
    let endpoint_url_2: string;
    export { endpoint_url_2 as endpoint_url };
    let api_key_2: string;
    export { api_key_2 as api_key };
    let extra_params_3: {};
    export { extra_params_3 as extra_params };
    let models_2: {
        "gpt-4.1": {
            name: string;
            extra_params: {};
        };
        "gpt-4.1-mini": {
            name: string;
            extra_params: {};
        };
        "gpt-4o": {
            name: string;
            extra_params: {};
        };
        "gpt-4o-mini": {
            name: string;
            extra_params: {};
        };
    };
    export { models_2 as models };
}
export namespace openai_responses {
    let name_4: string;
    export { name_4 as name };
    let adapter_3: string;
    export { adapter_3 as adapter };
    let endpoint_url_3: string;
    export { endpoint_url_3 as endpoint_url };
    let api_key_3: string;
    export { api_key_3 as api_key };
    let extra_params_4: {};
    export { extra_params_4 as extra_params };
    let models_3: {
        "gpt-4.1": {
            name: string;
            extra_params: {};
        };
        "gpt-4o": {
            name: string;
            extra_params: {};
        };
    };
    export { models_3 as models };
}
export namespace deepseek {
    let name_5: string;
    export { name_5 as name };
    let adapter_4: string;
    export { adapter_4 as adapter };
    let endpoint_url_4: string;
    export { endpoint_url_4 as endpoint_url };
    let api_key_4: string;
    export { api_key_4 as api_key };
    let extra_params_5: {};
    export { extra_params_5 as extra_params };
    let models_4: {
        "deepseek-chat": {
            name: string;
            extra_params: {};
        };
        "deepseek-reasoner": {
            name: string;
            extra_params: {};
        };
    };
    export { models_4 as models };
}
export namespace google {
    let name_6: string;
    export { name_6 as name };
    let adapter_5: string;
    export { adapter_5 as adapter };
    let endpoint_url_5: string;
    export { endpoint_url_5 as endpoint_url };
    let api_key_5: string;
    export { api_key_5 as api_key };
    let extra_params_6: {};
    export { extra_params_6 as extra_params };
    let models_5: {
        "gemini-2.5-flash": {
            name: string;
            extra_params: {};
        };
        "gemini-2.5-pro": {
            name: string;
            extra_params: {};
        };
    };
    export { models_5 as models };
}
export namespace qwen {
    let name_7: string;
    export { name_7 as name };
    let adapter_6: string;
    export { adapter_6 as adapter };
    let endpoint_url_6: string;
    export { endpoint_url_6 as endpoint_url };
    let api_key_6: string;
    export { api_key_6 as api_key };
    let extra_params_7: {};
    export { extra_params_7 as extra_params };
    let models_6: {
        "qwen-plus": {
            name: string;
            extra_params: {};
        };
        "qwen-turbo": {
            name: string;
            extra_params: {};
        };
    };
    export { models_6 as models };
}
export namespace grok {
    let name_8: string;
    export { name_8 as name };
    let adapter_7: string;
    export { adapter_7 as adapter };
    let endpoint_url_7: string;
    export { endpoint_url_7 as endpoint_url };
    let api_key_7: string;
    export { api_key_7 as api_key };
    export namespace extra_params_8 {
        let collection_ids: string[];
    }
    export { extra_params_8 as extra_params };
    let models_7: {
        "grok-4-1-fast-non-reasoning": {
            name: string;
            extra_params: {};
        };
        "grok-3": {
            name: string;
            extra_params: {};
        };
        "grok-2": {
            name: string;
            extra_params: {};
        };
    };
    export { models_7 as models };
}
export namespace mcp {
    let name_9: string;
    export { name_9 as name };
    let adapter_8: string;
    export { adapter_8 as adapter };
    let endpoint_url_8: string;
    export { endpoint_url_8 as endpoint_url };
    let api_key_8: string;
    export { api_key_8 as api_key };
    let extra_params_9: {};
    export { extra_params_9 as extra_params };
    export namespace models_8 {
        namespace _default_1 {
            let name_10: string;
            export { name_10 as name };
            let extra_params_10: {};
            export { extra_params_10 as extra_params };
        }
        export { _default_1 as default };
    }
    export { models_8 as models };
}
export namespace test {
    let name_11: string;
    export { name_11 as name };
    let adapter_9: string;
    export { adapter_9 as adapter };
    let endpoint_url_9: string;
    export { endpoint_url_9 as endpoint_url };
    export let allow_local: boolean;
    let api_key_9: string;
    export { api_key_9 as api_key };
    export namespace models_9 {
        namespace mock {
            let name_12: string;
            export { name_12 as name };
        }
    }
    export { models_9 as models };
}
