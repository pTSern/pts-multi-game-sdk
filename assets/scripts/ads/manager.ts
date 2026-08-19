import { _decorator, JsonAsset } from "cc";
import { Ads_GameDistribution } from "./GameDistribution";
import { Ads_SDK } from "./sdk";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { editor_property } from "db://pts-core/scripts/utils/pClass";
import { pConst, pEngine } from "db://pts-core/scripts/utils";

let _$glb: Ads_SDK = null;
let _$rs = null;
let _$prm: Promise<Ads_SDK> = new Promise<Ads_SDK>((_rs, _rj) => _$rs = _rs);
function _initSDK(cfg: any) {
    if (!cfg || _$glb) return;
    //if(DEV) return

    if (cfg.platform === 'game_distribution') {
        const _ads = new Ads_GameDistribution();
        _ads.init({ game_id: cfg.game_id });
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
    showInterstitialAds: (...args: any[]) => void
}

@ccclass('Ads_Manager')
export abstract class Ads_Manager<_T extends _ICore> extends Event_Driver<_I> {
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

    protected abstract _onRewardAdsComplete(...args: Parameters<_T['showRewardAds']>): void
    protected abstract _onRewardAdsFailed(error: Error, ...args: Parameters<_T['showRewardAds']>): void

    public async showRewardAds(...args: Parameters<_T['showRewardAds']>) {
        if(this._isShowingRewardAds) {
            const _error = new Error('Please wait');
            this.emit('onShowRewardAdsFailed', _error, ...args);
            this._onRewardAdsFailed(_error, ...args);
            return;
        }

        this._isShowingRewardAds = true;
        await _$prm;

        return new Promise<void>((_rs, _rj) => {
            _$glb.showRewardAds(() => {
                this.emit('onShowRewardAdsComplete', ...args);
                this._onRewardAdsComplete(...args);
                _rs();
            }, _e => {
                this.emit('onShowRewardAdsFailed', _e, ...args);
                this._onRewardAdsFailed(_e, ...args);
            }, () => this._isShowingRewardAds = false)
        })
    }

    protected abstract _actShowInterAdsLogic(...args: Parameters<_T['showInterstitialAds']>): boolean
    protected abstract _onShowInterAdsComplete(...args: Parameters<_T['showInterstitialAds']>): void

    public async showInterstitialAds(...args: Parameters<_T['showInterstitialAds']>) {
        if(this._actShowInterAdsLogic(...args)) {
            _$glb.showInterstitialAds();
            this._onShowInterAdsComplete(...args);
        }
    }
}

export namespace Ads_Manager {
    export type TCore = _ICore
}
