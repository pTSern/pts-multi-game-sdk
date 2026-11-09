import { _decorator, game, size, Size } from "cc";
import { Ads_SDK } from "./sdk";
import { editor_property } from "db://pts-core/scripts/utils/pClass";
import { pGlobal } from "db://pts-core/scripts/utils";

const { ccclass, property, menu } = _decorator

type _TState = 'unload' | 'requested' | 'loaded'

@ccclass('Ads_CrazyGame')
@menu('SDK/Ads/CrazyGame')
export class Ads_CrazyGame extends Ads_SDK {
    @property({  })
    banner_id: string = "pts__gd__banner__style";

    @property({})
    is_responsive_banner: boolean = true;

    @property({ visible() { return !this.is_responsive_banner } })
    size: Size = size(300, 50);

    @editor_property()
    protected _state: _TState = 'unload'

    protected _sdk: CrazyGames.SDKInstance = null

    showInterstitialAds(): void {
        game.pause();

        try {
            this._sdk.ad.requestAd('midgame', {
                adError(_error) {
                    pGlobal.error({ level: "ALL", group: "CrazyGames" }, "Failed to show Interstitial Ads", _error);
                    game.resume();
                },

                adStarted() {
                    pGlobal.log({ level: "ALL", group: "CrazyGames" }, "Start Showing Interstitial Ads");

                },

                adFinished() {
                    pGlobal.log({ level: "ALL", group: "CrazyGames" }, "Showing Interstitial Ads Complete");
                    game.resume();
                }
            });
        } catch (error) {
            game.resume();
            pGlobal.log({ level: "ALL", group: "CrazyGames" }, 'Failed to show interstitial ads:', error);
        }
    }

    showRewardAds(onSuccess: pFlex.TFunc, onFailed: pFlex.TFunc, onFinally: pFlex.TFunc): void {
        game.pause();

        try {
            this._sdk.ad.requestAd('rewarded', {
                adError(_error) {
                    pGlobal.error({ level: "ALL", group: "CrazyGames" }, "Failed to show Reward Ads", _error);
                    onFailed?.();
                    onFinally?.();
                    game.resume();
                },

                adStarted() {
                    pGlobal.log({ level: "ALL", group: "CrazyGames" }, "Start Showing Reward Ads");
                },

                adFinished() {
                    pGlobal.log({ level: "ALL", group: "CrazyGames" }, "Showing Reward Ads Complete");
                    onSuccess?.();
                    onFinally?.();
                    game.resume();
                }
            })
        } catch (error) {
            game.resume();
            pGlobal.error({ level: "ALL", group: "CrazyGames" }, 'Failed to show reward ads:', error);
        }
    }

    sendReplayEvent(): void {
    }

    async showBannerAds() {
        try {
            pGlobal.log({ level: "ALL", group: "CrazyGames" }, "Show Banner Ads >>", this.banner_id, "Responsive:", this.is_responsive_banner);
            await (this.is_responsive_banner ? this._sdk.banner.requestResponsiveBanner(this.banner_id) : this._sdk.banner.requestBanner({ id: this.banner_id, width: 320, height: 50 }));
        } catch (error) {
            pGlobal.error({ level: "ALL", group: "CrazyGames" }, "Show Banner Ads Error: ", error);
        }
    }

    protected _isValid(): boolean {
        return typeof CrazyGames !== 'undefined' && !!CrazyGames.SDK && this._state === 'loaded';
    }

    protected _onLoad(): void {
        this._init();
    }

    protected _init() {
        if (this._state !== 'unload') {
            return;
        }

        this._state = 'requested';
        const tag = document.createElement('script');
        tag.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
        tag.async = true;
        tag.onload = async () => {
            this._sdk = CrazyGames.SDK;
            await this._sdk.init({ wrapper: { engine: "cocos", sdkVersion: '2.0.0' } });
            this._state = 'loaded';
        };
        tag.onerror = () => console.error('Failed to load CrazySDK JS. Please check your internet connection.');
        document.head.appendChild(tag);
    }
}
