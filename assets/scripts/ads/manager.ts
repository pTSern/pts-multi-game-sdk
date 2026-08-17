import { _decorator, Component } from "cc";
import { Ads_GameDistribution } from "./GameDistribution";
import { Ads_SDK } from "./sdk";
import { singleton } from "db://pts-core/scripts/utils/pClass";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { DEV } from "cc/env";

let _$glb: Ads_SDK = null;
function _initSDK(cfg: any) {
    if (!cfg || _$glb) return;
    //if(DEV) return

    if (cfg.platform === 'game_distribution') {
        const _ads = new Ads_GameDistribution();
        _ads.init({ game_id: DEV ? "" : cfg.game_id });
        _$glb = _ads;
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

@ccclass('Ads_Manager')
@singleton()
export class Ads_Manager extends Event_Driver<_I> {
    protected static _$bounces = ['onShowRewardAds', 'onShowRewardAdsFailed', 'onShowRewardAdsComplete', 'onSDKReady']

    showRewardAds() {
        this.emit('onShowRewardAds');
        return new Promise<void>((resolve, reject) => {
            _$glb.showRewardAds(() => {
                this.emit('onShowRewardAdsComplete');
                resolve();
            }, () => {
                this.emit('onShowRewardAdsFailed');
                reject();
            })
        })
    }

}
