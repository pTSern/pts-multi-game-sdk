import { _decorator } from "cc";
import { Ads_SDK } from "./sdk";
import { pString } from "db://pts-core/scripts/utils";

const { ccclass, property, menu } = _decorator;

@ccclass('Ads_YTM')
@menu('SDK/Ads/YTM')
export class Ads_YTM extends Ads_SDK {
    @property({})
    reward_uuid: string = pString.uuid([2, 4, 8, 4, 2])

    showInterstitialAds(): void {
        ytgame.ads.requestInterstitialAd()
    }

    showRewardAds(onSuccess: pFlex.TFunc, onFailed: pFlex.TFunc, onFinally: pFlex.TFunc): void {
        ytgame.ads.requestRewardedAd(this.reward_uuid).then(_is => _is && onSuccess()).catch(onFailed).finally(onFinally)
    }

    sendReplayEvent(): void {
    }

    showBannerAds(...args: any[]): Promise<any> {
        return Promise.resolve();
    }

    protected _isValid(): boolean {
        return typeof ytgame !='undefined' && gdsdk !== undefined && ytgame.IN_PLAYABLES_ENV;
    }
}
