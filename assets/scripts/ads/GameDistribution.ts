import { director, sys } from "cc";
import { Ads_SDK } from "./sdk";
import { pGlobal } from "db://pts-core/scripts/utils";

export class Ads_GameDistribution extends Ads_SDK {

    init(gameId: string): void {
        const _opt: gdsdk.IOptions = {
            gameId,
            onEvent: (event: gdsdk.IEvent) => {
                switch(event.name) {
                    case "SDK_READY": {
                        gdsdk.preloadAd('interstitial').then( ( ) => {

                        } )
                        break;
                    }
                    case "SDK_GAME_START": {
                        director.resume();

                        break;
                    }
                    case "SDK_GAME_PAUSE": {
                        director.pause();

                        break;
                    }
                    case "SDK_GDPR_TRACKING": {

                        break;
                    }
                    case "AD_ERROR": {

                        break;
                    }
                    case "AD_SDK_CANCELED": {

                        break;
                    }
                    case "ALL_ADS_COMPLETED": {

                        break;
                    }
                }
            }
        }

        this._actCreateStorage();
    }

    protected _actCreateStorage() {
        const _map = new Map();

        const _storage = pTS.bridge.replican<Record<string, any>>({
            is_dict_mode: true,
            is_ambiguous: true,
            asynctify: {
                async set(k, v) {
                    let _key = _map.get(k);
                    let _value = null;

                    if(!_key) {
                        [_key, _value] = await Promise.all([pGlobal.gzip(k), pGlobal.gzip(v)])
                        _map.set(k, _key);

                    } else {
                        _value = await pGlobal.gzip(v);
                    }

                    sys.localStorage.setItem(_key, _value)

                },
                async get(k) {
                    let _key = _map.get(k);
                    if(!_key) {
                        _key = await pGlobal.gzip(k);
                        _map.set(k, _key);
                    }

                    const _val = sys.localStorage.getItem(_key);

                    return pGlobal.unzip(_val);
                }
            }
        })

        pTS.bridge.set('storage', _storage);
    }

    showInterstitialAds(): void {
    }

    showRewardAds(): void {
    }

    sendReplayEvent(): void {
    }

    protected _isValid(): boolean {
        return typeof gdsdk !='undefined' && gdsdk !== undefined && gdsdk.preloadAd !== undefined && gdsdk.showAd !== undefined;
    }

}
