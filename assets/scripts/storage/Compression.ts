import { _decorator, sys } from "cc";
import { Storage_Base } from "./storage";
import { pGlobal, pLazy } from "db://pts-core/scripts/utils";
import { IS_TEST } from "db://pts-core/scripts/utils/pConst";

const { ccclass, property } = _decorator;

const _enum: Record<CompressionFormat, CompressionFormat> = {
    gzip: 'gzip',
    deflate: "deflate",
    "deflate-raw": "deflate-raw"
}

pLazy.enums(_enum)

@ccclass('Storage_Compression')
export class Storage_Compression extends Storage_Base {
    @property({ type: _enum })
    format: CompressionFormat = 'gzip';

    protected _creator(): pTS.bridge.ILinearCache<any> | pTS.bridge.ISyncCache<any> {
        const _map = new Map();

        const _storage = pTS.bridge.replican<Record<string, any>>({
            is_dict_mode: true,
            is_ambiguous: true,
            asynctify: {
                async set(k, v) {
                    try {
                        let _key = _map.get(k);
                        let _value = null;

                        const _jsonVal = JSON.stringify(v);

                        if(!_key) {
                            [_key, _value] = await Promise.all([pGlobal.gzip(k, this.format), pGlobal.gzip(_jsonVal, this.format)])
                            _map.set(k, _key);

                        } else {
                            _value = await pGlobal.gzip(_jsonVal, this.format);
                        }

                        sys.localStorage.setItem(_key, _value);
                        IS_TEST && console.log("[Storage] >> Set key:", k, "\nValue:", v, "\nCompressed key:", _key, "\nCompressed value:", _value);
                    } catch (error) {
                        IS_TEST && console.error("[Storage] >> Failed to set key:", k, error);
                        throw error;
                    }
                },
                async get(k) {
                    let _key = _map.get(k);
                    if(!_key) {
                        _key = await pGlobal.gzip(k, this.format);
                        _map.set(k, _key);
                    }

                    const _val = sys.localStorage.getItem(_key);
                    if(!_val) return null;

                    let _unzipped = await pGlobal.unzip(_val, this.format);
                    let _err: Error | null = null;
                    try {
                        _unzipped = JSON.parse(_unzipped);
                    } catch (e) { _unzipped = undefined; _err = e as Error; }

                    IS_TEST && console.log("[Storage] >> Get key:", k, "\nCompressed key:", _key, "\nCompressed value:", _val, "\nUnzipped value:", _unzipped);
                    return _unzipped;
                }
            }
        })

        console.log("[Storage] >> Created storage via Bridge >>", _storage);
        return _storage;
    }
}
