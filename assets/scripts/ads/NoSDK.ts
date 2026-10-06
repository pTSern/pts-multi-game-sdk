import { _decorator } from 'cc';
import { pTSAsset } from 'db://pts-core/scripts/pTSAsset';
import { Ads_SDK } from './sdk';

const { ccclass, property } = _decorator;

@ccclass('NoSDK')
@pTSAsset.menu('SDK/Ads/NoSDK')
export class NoSDK extends Ads_SDK {
    @property({  })
    isAlwaySuccess: boolean = true;

    showInterstitialAds(): void {
    }

    showRewardAds(onSuccess: pFlex.TFunc, onFailed: pFlex.TFunc, onFinally: pFlex.TFunc): void {
        this.isAlwaySuccess ? onSuccess() : onFailed();
        onFinally();
    }

    sendReplayEvent(): void {
    }

    showBannerAds(...args: any[]): Promise<any> {
        return Promise.resolve();
    }

    protected _isValid(): boolean {
        return true;
    }
}
