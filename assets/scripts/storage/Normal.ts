import { _decorator, sys } from "cc";
import { Storage_Base } from "./storage";
import { IS_TEST } from "db://pts-core/scripts/utils/pConst";

const { ccclass } = _decorator

@ccclass('Storage_Normal')
export class Storage_Normal extends Storage_Base {
    protected _creator(): pTS.bridge.ILinearCache<any> | pTS.bridge.ISyncCache<any> {
        const _storage = pTS.bridge.replican<Record<string, any>>({
            is_dict_mode: true,
            is_ambiguous: true,
            asynctify: {
                async set(k, v) {
                    try {
                        const _jsonVal = JSON.stringify(v);

                        sys.localStorage.setItem(k, _jsonVal);
                        IS_TEST && console.log("[Storage] >> Set key:", k, "\nValue:", v);
                    } catch (error) {
                        IS_TEST && console.error("[Storage] >> Failed to set key:", k, error);
                        throw error;
                    }
                },
                async get(k) {
                    const _val = sys.localStorage.getItem(k);
                    if(!_val) return null;

                    IS_TEST && console.log("[Storage] >> Get key:", k, "\nCompressed value:", _val);
                    return JSON.parse(_val);
                }
            }
        })
        return _storage;
    }
}
