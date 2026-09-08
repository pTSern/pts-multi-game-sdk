import { _decorator } from "cc";
import { pTSAsset } from "db://pts-core/scripts/pTSAsset";
const { ccclass  } = _decorator

@ccclass("Ads_SDK")
export abstract class Ads_SDK extends pTSAsset {

    abstract showInterstitialAds(): void
    abstract showRewardAds(onSuccess: pFlex.TFunc, onFailed: pFlex.TFunc, onFinally: pFlex.TFunc): void
    abstract sendReplayEvent(): void
    abstract showBannerAds(...args: any[]): Promise<any>
    protected abstract _isValid(): boolean

    //protected _event = new pDriver.Handler<_TEvent>()
}


