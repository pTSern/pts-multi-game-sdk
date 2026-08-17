export abstract class Ads_SDK {

    abstract init(...args: any[]): void
    abstract showInterstitialAds(): void
    abstract showRewardAds(onSuccess: pFlex.TFunc, onFailed: pFlex.TFunc, onFinally: pFlex.TFunc): void
    abstract sendReplayEvent(): void
    protected abstract _isValid(): boolean

    //protected _event = new pDriver.Handler<_TEvent>()
}


