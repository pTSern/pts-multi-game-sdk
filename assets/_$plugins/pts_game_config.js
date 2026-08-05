const _ = Object.create(null);
_.version = "1.0.2";
_.prefix_key = "wm$_$";
_.platform = "game_distribution";
globalThis['pTS'] = globalThis['pTS'] || {};
globalThis['pTS']['game'] = globalThis['pTS']['game'] || Object.create(null);
globalThis['pTS']['game']['config'] = _;

const _$pts = globalThis.pTS;
if (!!_$pts) {
    const _$bridge = _$pts.bridge;
    (!!_$bridge && typeof _$bridge.set == 'function') ? _$bridge.set('config', _) : console.warn('pts-multi-game-sdk ~ [pTS.bridge] is not defined');
}
