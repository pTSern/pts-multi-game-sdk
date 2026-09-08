import { _decorator, JsonAsset } from "cc";
import { Ads_SDK } from "./sdk";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { editor_property } from "db://pts-core/scripts/utils/pClass";
import { pConst, pEngine } from "db://pts-core/scripts/utils";
import { DEV } from "cc/env";

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
    showBannerAds: (...args: any[]) => void
}

@ccclass('Ads_Manager')
export abstract class Ads_Manager<_T extends _ICore> extends Event_Driver<_I> {
    protected static _$bounces = ['onShowRewardAds', 'onShowRewardAdsFailed', 'onShowRewardAdsComplete', 'onSDKReady']

    @property({ type: Ads_SDK })
    pTestSDK: Ads_SDK = null;

    @property({ type: Ads_SDK })
    pProdSDK: Ads_SDK = null;

    @editor_property()
    protected _isShowingRewardAds: boolean = false;

    @property({ type: JsonAsset, group: pConst.GROUPS.get('Listener') })
    onShowRewardAds: JsonAsset[] = [];
    @property({ type: JsonAsset, group: pConst.GROUPS.get('Listener') })
    onShowInterstitialAds: JsonAsset[] = [];
    @property({ type: JsonAsset, group: pConst.GROUPS.get('Listener') })
    actShowBannerAds: JsonAsset[] = [];

    @property({ min: 0 })
    numRefreshBannerInterval: number = 15;

    protected __preload(): void {
        super.__preload();
        pEngine.Json.event.add(this.onShowRewardAds, { func: this.showRewardAds, binder: this });
        pEngine.Json.event.add(this.onShowInterstitialAds, { func: this.showInterstitialAds, binder: this });
        pEngine.Json.event.add(this.actShowBannerAds, { func: this.showBannerAds, binder: this });

        this._refresher = this.showBannerAds.bind(this)
        !DEV && this.schedule(this._refresher, this.numRefreshBannerInterval);
    }

    get sdk() { return pConst.IS_TEST ? this.pTestSDK : this.pProdSDK }

    protected _refresher: Function

    protected onDestroy(): void {
        super.onDestroy();
        this.unschedule(this._refresher);
        pEngine.Json.event.remove(this.onShowRewardAds, { func: this.showRewardAds, binder: this });
        pEngine.Json.event.remove(this.onShowInterstitialAds, { func: this.showInterstitialAds, binder: this });
        pEngine.Json.event.remove(this.actShowBannerAds, { func: this.showBannerAds, binder: this });
    }

    protected abstract _onRewardAdsComplete(...args: Parameters<_T['showRewardAds']>): void
    protected abstract _onRewardAdsFailed(error: Error, ...args: Parameters<_T['showRewardAds']>): void

    public async showRewardAds(...args: Parameters<_T['showRewardAds']>) {
        if(this._isShowingRewardAds) {
            const _error = new Error('Please wait');
            this.emit('onShowRewardAdsFailed', _error, ...args);
            this._onRewardAdsFailed(_error, ...args);
            return false;
        }

        this._isShowingRewardAds = true;

        return new Promise<boolean>(_rs => {
            const _failed = (_e: Error) => {
                this.emit('onShowRewardAdsFailed', _e, ...args);
                this._onRewardAdsFailed(_e, ...args);
                _rs(false);
            }

            const _finish = () => this._isShowingRewardAds = false;

            try {
                this.sdk.showRewardAds(() => {
                    this.emit('onShowRewardAdsComplete', ...args);
                    this._onRewardAdsComplete(...args);
                    _rs(true);
                }, _failed, _finish);
            } catch (_e) { _failed(_e) }
            finally { _finish() };
        })
    }

    protected abstract _actShowInterAdsLogic(...args: Parameters<_T['showInterstitialAds']>): boolean
    protected abstract _onShowInterAdsComplete(...args: Parameters<_T['showInterstitialAds']>): void

    public async showInterstitialAds(...args: Parameters<_T['showInterstitialAds']>) {
        if(this._actShowInterAdsLogic(...args)) {
            this.sdk.showInterstitialAds();
            this._onShowInterAdsComplete(...args);
        }
    }

    public showBannerAds(...args: Parameters<_T['showBannerAds']>) {
        console.log("[Ads_Manager] >> showBannerAds", ...args, this.sdk);
        this.sdk.showBannerAds(...args);
    }
}

export namespace Ads_Manager {
    export type TCore = _ICore
}
