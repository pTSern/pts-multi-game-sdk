import { pDriver } from "db://pts-core/scripts/utils"

type _TEvent = "onRewardDone" | "onCancelReward"
export abstract class Ads_SDK {

    abstract init(...args: any[]): void
    abstract showInterstitialAds(): void
    abstract showRewardAds(): void
    abstract sendReplayEvent(): void
    protected abstract _isValid(): boolean

    //protected _event = new pDriver.Handler<_TEvent>()
}
