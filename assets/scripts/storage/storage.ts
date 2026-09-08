import { _decorator } from "cc";
import { pTSAsset } from "db://pts-core/scripts/pTSAsset";

const { ccclass } = _decorator;

@ccclass("Storage_Base")
export abstract class Storage_Base extends pTSAsset {
    protected abstract _creator(): pTS.bridge.ILinearCache<any> | pTS.bridge.ISyncCache<any>

    install() {
        const _storage = this._creator();
        pTS.bridge.set('storage', _storage);
    }
}
