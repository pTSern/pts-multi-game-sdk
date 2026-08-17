import { _decorator, director, sys } from "cc";
import { Ads_SDK } from "./sdk";
import { pGlobal } from "db://pts-core/scripts/utils";
import { DEV } from "cc/env";
import _$glb from "./manager";

interface _IOpt {
    game_id: string,
}

export class Ads_GameDistribution extends Ads_SDK {
    init(opt: _IOpt): void {
        const _opt: gdsdk.IOptions = {
            gameId: opt.game_id,
            onEvent: (event: gdsdk.IEvent) => {
                switch(event.name) {
                    case "SDK_READY": {
                        gdsdk.preloadAd('interstitial').then( ( ) => {

                        } )
                        gdsdk.showAd(gdsdk.AdType.Display, {containerId: 'CONTAINER_ID_TO_PUT_AD_IN'})
                            .then(() => console.info('showAd(gdsdk.AdType.Display)'))
                            .catch(e => console.info(e));

                        console.log("[GameDistribution] >> SDK is ready.");
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
                    case "AD_ERROR":
                    case "AD_SDK_CANCELED": {
                        this._onShowRewardAdsFailed();

                        break;
                    }
                    case "ALL_ADS_COMPLETED": {
                        this._onShowRewardAdsComplete();

                        break;
                    }
                }
            }
        }

        window['GD_OPTIONS'] = _opt;
        (function (d, s, id) {
            var fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            const js = d.createElement(s);
            js.id = id;
            //@ts-ignore
            js.src = 'https://html5.api.gamedistribution.com/main.min.js';
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'gamedistribution-jssdk'));
        this._actCreateStorage();
    }

    protected _actCreateStorage() {
        const _map = new Map();

        const _storage = pTS.bridge.replican<Record<string, any>>({
            is_dict_mode: true,
            is_ambiguous: true,
            asynctify: {
                async set(k, v) {
                    try {
                        let _key = _map.get(k);
                        let _value = null;

                        const _jsonVal = JSON.stringify(v);

                        if(!_key) {
                            [_key, _value] = await Promise.all([pGlobal.gzip(k), pGlobal.gzip(_jsonVal)])
                            _map.set(k, _key);

                        } else {
                            _value = await pGlobal.gzip(_jsonVal);
                        }

                        sys.localStorage.setItem(_key, _value);
                        DEV && console.log("[Storage] >> Set key:", k, "\nValue:", v, "\nCompressed key:", _key, "\nCompressed value:", _value);
                    } catch (error) {
                        DEV && console.error("[Storage] >> Failed to set key:", k, error);
                        throw error;
                    }
                },
                async get(k) {
                    let _key = _map.get(k);
                    if(!_key) {
                        _key = await pGlobal.gzip(k);
                        _map.set(k, _key);
                    }

                    const _val = sys.localStorage.getItem(_key);
                    if(!_val) return null;


                    let _unzipped = await pGlobal.unzip(_val);
                    let _err: Error | null = null;
                    try {
                        _unzipped = JSON.parse(_unzipped);
                    } catch (e) { _unzipped = undefined }

                    DEV && console.log("[Storage] >> Get key:", k, "\nCompressed key:", _key, "\nCompressed value:", _val, "\nUnzipped value:", _unzipped);
                    return _unzipped;
                }
            }
        })

        pTS.bridge.set('storage', _storage);
    }

    protected _onShowRewardAdsComplete(): void {
        this._onSuccesses.forEach(_ => _());
        this._onSuccesses = [];
        console.log("[GameDistribution] >> Reward ads completed.");
    }

    protected _onSuccesses: pFlex.TFunc[] = [];
    protected _onFaileds: pFlex.TFunc[] = [];

    protected _onShowRewardAdsFailed(): void {
        this._onFaileds.forEach(_ => _());
        this._onFaileds = [];
        console.log("[GameDistribution] >> Reward ads failed.");
    }

    showInterstitialAds(): void {
    }

    showRewardAds(onSuccess: pFlex.TFunc, onFailed: pFlex.TFunc): void {
        if(gdsdk !== undefined && gdsdk !== undefined) {
            this._onSuccesses.push(onSuccess);
            this._onFaileds.push(onFailed);
            gdsdk.showAd('rewarded');
        }
    }

    sendReplayEvent(): void {
    }

    protected _isValid(): boolean {
        return typeof gdsdk !='undefined' && gdsdk !== undefined && gdsdk.preloadAd !== undefined && gdsdk.showAd !== undefined;
    }
}

