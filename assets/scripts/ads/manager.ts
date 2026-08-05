import { Ads_GameDistribution } from "./GameDistribution";
import { Ads_SDK } from "./sdk";

let _glb: Ads_SDK = null;

function _initSDK(cfg: any) {
    if (!cfg || _glb) return;

    if (cfg.platform === 'game_distribution') {
        _glb = new Ads_GameDistribution();
        _glb.init();
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

export default _glb;

