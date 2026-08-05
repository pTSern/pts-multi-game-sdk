import { _IConfig, _IThis } from "./types";
import fs from 'fs';
import path from 'path';
import pkg from '../package.json';

const PLUGIN_NAME = 'pts_game_config';

const __config_: _IConfig = Object.create(null);
const __this_ = Object.create(null) as _IThis;

export function load() {
    //@ts-ignore
    Editor.Message.addBroadcastListener('scene:ready', _load);
    _load();
}

export function unload() {}

export const methods: { [key: string]: (...any: any) => any } = {
    openPanel() {
        Editor.Panel.open(pkg.name);
    },
    onChangedGameId: function() {

    },
    onChangedPlatform: function(key: any, value: any) {
        const val = typeof value === 'string' ? value : (typeof key === 'string' ? key : 'game_distribution');
        __config_.target_platform = val;
        _shippingProjectSettingPlugin();
    },
    onChangedSetting: function<_TKey extends keyof _IConfig>(key: _TKey, value: _IConfig[_TKey]) {
        __config_[key] = value;
        _shippingProjectSettingPlugin();
    },
    onSaved: function() {
        Editor.Profile.getProject(pkg.name).then(async _ => {
            _shippingProjectSettingPlugin();
        });
    },
};

async function _shippingProjectSettingPlugin() {
    if (!__config_) return;

    // Fixed plugin output directory inside extension assets folder: extensions/pts-multi-game-sdk/assets/_$plugins
    const extensionAssetsPhysic = path.resolve(__dirname, '..', 'assets', '_$plugins');
    const extensionAssetsDb = `db://${pkg.name}/_$plugins`;

    try {
        if (!fs.existsSync(extensionAssetsPhysic)) {
            fs.mkdirSync(extensionAssetsPhysic, { recursive: true });
            await Editor.Message.request('asset-db', 'refresh-asset', extensionAssetsDb);
        }
    } catch (e) {
        console.error(`[${pkg.name}] Failed to create extension plugin directory:`, extensionAssetsPhysic, e);
        return;
    }

    const head = __config_.head_version !== undefined ? __config_.head_version : 1;
    const sub = __config_.sub_version !== undefined ? __config_.sub_version : 0;
    const tail = __config_.tail_version !== undefined ? __config_.tail_version : 1;
    const versionStr = `${head}.${sub}.${tail}`;
    const prefixKey = __config_.prefix_key !== undefined ? __config_.prefix_key : '';
    const platform = __config_.target_platform !== undefined ? __config_.target_platform : 'game_distribution';

    const parts = ['pTS', 'game', 'config'];

    // JS generation
    let jsCode = `const _ = Object.create(null);\n`;
    jsCode += `_.version = "${versionStr}";\n`;
    jsCode += `_.prefix_key = "${prefixKey}";\n`;
    jsCode += `_.platform = "${platform}";\n`;

    let current = 'globalThis';
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
            jsCode += `${current}['${part}'] = _;\n`;
        } else {
            const next = `${current}['${part}']`;
            const init = i === 0 ? '{}' : 'Object.create(null)';
            jsCode += `${next} = ${next} || ${init};\n`;
            current = next;
        }
    }

    jsCode += `
const _$pts = globalThis.pTS;
if (!!_$pts) {
    const _$bridge = _$pts.bridge;
    (!!_$bridge && typeof _$bridge.set == 'function') ? _$bridge.set('config', _) : console.warn('${pkg.name} ~ [pTS.bridge] is not defined');
}
`;

    // DTS generation
    let dtsCode = `
interface _IData {
   version: string;
   prefix_key: string;
   platform: string;
}

`;
    for (let i = 0; i < parts.length - 1; i++) {
        const indent = '\t'.repeat(i);
        const keyword = i === 0 ? 'declare namespace' : 'export namespace';
        dtsCode += `${indent}${keyword} ${parts[i]} {\n`;
    }

    const innerIndent = '\t'.repeat(parts.length - 1);
    const exportKeyword = parts.length === 1 ? 'declare const' : 'export const';
    dtsCode += `${innerIndent}${exportKeyword} ${parts[parts.length - 1]}: _IData;\n`;

    for (let i = parts.length - 2; i >= 0; i--) {
        const indent = '\t'.repeat(i);
        dtsCode += `${indent}}\n`;
    }

    dtsCode += `
declare namespace pTS {
    export namespace bridge {
        export type _TData_Definded_By_Extensions = {
            config: _IData
        }
    }
}
`;

    const jsPath = path.join(extensionAssetsPhysic, `${PLUGIN_NAME}.js`);
    const dtsPath = path.join(extensionAssetsPhysic, `${PLUGIN_NAME}.d.ts`);
    const jsUrl = `${extensionAssetsDb}/${PLUGIN_NAME}.js`;
    const dtsUrl = `${extensionAssetsDb}/${PLUGIN_NAME}.d.ts`;

    try {
        fs.writeFileSync(jsPath, jsCode, 'utf8');
        await Editor.Message.request('asset-db', 'refresh-asset', jsUrl);

        // Update meta for JS to make it a plugin script
        const pluginSettings = {
            isPlugin: true,
            loadPluginInWeb: true,
            loadPluginInNative: true,
            loadPluginInEditor: true,
            loadPluginInPreview: true,
            loadPluginInMiniGame: true
        };

        try {
            const objMeta = await Editor.Message.request('asset-db', 'query-asset-meta', jsUrl) as any;
            if (objMeta) {
                objMeta.userData = objMeta.userData || {};
                let needUpdate = false;
                for (const key in pluginSettings) {
                    if (objMeta.userData[key] !== (pluginSettings as any)[key]) {
                        objMeta.userData[key] = (pluginSettings as any)[key];
                        needUpdate = true;
                    }
                }

                if (needUpdate) {
                    await Editor.Message.request('asset-db', 'save-asset-meta', objMeta.uuid, JSON.stringify(objMeta));
                    await Editor.Message.request('asset-db', 'refresh-asset', jsUrl);
                }
            }
        } catch (e) {}

        // Fallback: Check & update physical .meta file directly on disk
        const jsMetaPath = jsPath + '.meta';
        if (fs.existsSync(jsMetaPath)) {
            try {
                const rawMeta = fs.readFileSync(jsMetaPath, 'utf8');
                const metaContent = JSON.parse(rawMeta) || {};
                metaContent.userData = metaContent.userData || {};
                metaContent.files = metaContent.files && metaContent.files.length ? metaContent.files : ['.js'];
                let needUpdate = false;
                for (const key in pluginSettings) {
                    if (metaContent.userData[key] !== (pluginSettings as any)[key]) {
                        metaContent.userData[key] = (pluginSettings as any)[key];
                        needUpdate = true;
                    }
                }
                if (needUpdate) {
                    fs.writeFileSync(jsMetaPath, JSON.stringify(metaContent, null, 2), 'utf8');
                    await Editor.Message.request('asset-db', 'refresh-asset', jsUrl);
                }
            } catch (e) {}
        }

        // Save DTS file
        fs.writeFileSync(dtsPath, dtsCode, 'utf8');
        await Editor.Message.request('asset-db', 'refresh-asset', dtsUrl);

        console.log(`[${pkg.name}] Successfully generated plugin files inside extension at: ${jsUrl}`);
    } catch (e) {
        console.error(`[${pkg.name}] Failed to write plugin assets inside extension:`, e);
    }
}

async function _load() {
    if (__this_.is_loaded) return;
    __this_.is_loaded = true;

    Editor.Profile.getProject(pkg.name).then(async _ => {
        Object.assign(__config_, _);
        await _shippingProjectSettingPlugin();
    });
}


