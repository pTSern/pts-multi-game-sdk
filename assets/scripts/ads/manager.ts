import { _decorator, Component, JsonAsset } from "cc";
import { Ads_GameDistribution } from "./GameDistribution";
import { Ads_SDK } from "./sdk";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { DEV } from "cc/env";
import { editor_property } from "db://pts-core/scripts/utils/pClass";
import { pConst, pEngine } from "db://pts-core/scripts/utils";

let _$glb: Ads_SDK = null;
let _$rs = null;
let _$prm: Promise<Ads_SDK> = new Promise<Ads_SDK>((_rs, _rj) => _$rs = _rs);
function _initSDK(cfg: any) {
    if (!cfg || _$glb) return;
    if(DEV) return

    if (cfg.platform === 'game_distribution') {
        const _ads = new Ads_GameDistribution();
        _ads.init({ game_id: DEV ? "" : cfg.game_id });
        _$glb = _ads;
        _$rs(_ads);
    }
}

const _pTS = globalThis.pTS;
if (!!(_pTS?.bridge)) {
    const _cfg = _pTS.bridge.get('config');
    if (_cfg) {
        _initSDK(_cfg);
    } else {
        _pTS.bridge.once('set', (_k, _cfg: any) => {
            if (_k === 'config') {
                _initSDK(_cfg);
            }
        });
    }
}

export default _$glb;

const { ccclass, property } = _decorator

interface _I {
    onShowRewardAds: any
    onShowRewardAdsFailed: any
    onShowRewardAdsComplete: any
    onSDKReady: any
}

interface _ICore {
    showRewardAds: (...args: any[]) => void
}

@ccclass('Ads_Manager')
export class Ads_Manager<_T extends _ICore> extends Event_Driver<_I> {
    protected static _$bounces = ['onShowRewardAds', 'onShowRewardAdsFailed', 'onShowRewardAdsComplete', 'onSDKReady']

    @editor_property()
    protected _isShowingRewardAds: boolean = false;

    @property({ type: JsonAsset, group: pConst.GROUPS.get('Listener') })
    onShowRewardAds: JsonAsset[] = [];
    @property({ type: JsonAsset, group: pConst.GROUPS.get('Listener') })
    onShowInterstitialAds: JsonAsset[] = [];

    protected __preload(): void {
        super.__preload();
        pEngine.Json.event.add(this.onShowRewardAds, { func: this.showRewardAds, binder: this });
    }

    protected onDestroy(): void {
        super.onDestroy();
        pEngine.Json.event.remove(this.onShowRewardAds, { func: this.showRewardAds, binder: this });
    }

    public async showRewardAds(...args: Parameters<_T['showRewardAds']>) {

        this._isShowingRewardAds = true;

        if(this._isShowingRewardAds) {
            this.emit('onShowRewardAdsFailed', new Error('Please wait'), ...args);
            return;
        }

        await _$prm;
        return new Promise<void>((_rs, _rj) => {
            _$glb.showRewardAds(() => {
                this.emit('onShowRewardAdsComplete', ...args);
                _rs();
            }, _e => {
                this.emit('onShowRewardAdsFailed', _e, ...args);
            }, () => this._isShowingRewardAds = false)
        })
    }
}

export namespace Ads_Manager {
    export type TCore = _ICore
}
