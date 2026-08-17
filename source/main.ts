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

async function _syncProfileAndShipping(key?: string, value?: any) {
    try {
        const profile = await Editor.Profile.getProject(pkg.name) as any || {};
        Object.assign(__config_, profile);
    } catch (e) {}

    if (key !== undefined && value !== undefined) {
        __config_[key] = value;
    }

    await _shippingProjectSettingPlugin();
}

export const methods: { [key: string]: (...any: any) => any } = {
    openPanel() {
        Editor.Panel.open(pkg.name);
    },
    onChangedGameId: async function(key: any, value: any) {
        const val = value !== undefined ? value : (typeof key === 'string' ? key : '');
        await _syncProfileAndShipping('game_distribution_game_id', val);
    },
    onChangedTiktokGameId: async function(key: any, value: any) {
        const val = value !== undefined ? value : (typeof key === 'string' ? key : '');
        await _syncProfileAndShipping('tiktok_game_id', val);
    },
    onChangedCrazyGameGameId: async function(key: any, value: any) {
        const val = value !== undefined ? value : (typeof key === 'string' ? key : '');
        await _syncProfileAndShipping('crazy_game_game_id', val);
    },
    onChangedPlatform: async function(key: any, value: any) {
        const val = typeof value === 'string' ? value : (typeof key === 'string' ? key : 'game_distribution');
        __config_.target_platform = val;
        await _syncProfileAndShipping('target_platform', val);
    },
    onChangedSetting: async function<_TKey extends keyof _IConfig>(key: _TKey, value: _IConfig[_TKey]) {
        await _syncProfileAndShipping(key as string, value);
    },
    onSaved: async function() {
        await _syncProfileAndShipping();
    },
};

function _getActivePlatformFields(platform: string, config: _IConfig): Record<string, any> {
    const fields: Record<string, any> = {};
    const prefix = `${platform}_`;

    // 1. Collect all keys matching the platform prefix (e.g. game_distribution_game_id -> game_id)
    for (const key of Object.keys(config)) {
        if (key.startsWith(prefix)) {
            const propName = key.substring(prefix.length);
            fields[propName] = config[key];
        }
    }

    // 2. Explicit mappings for known platform profiles
    if (platform === 'game_distribution') {
        if (fields.game_id === undefined && config.game_distribution_game_id !== undefined) {
            fields.game_id = config.game_distribution_game_id;
        }
    } else if (platform === 'tiktok') {
        if (fields.game_id === undefined && config.tiktok_game_id !== undefined) {
            fields.game_id = config.tiktok_game_id;
        }
    } else if (platform === 'crazy_game') {
        if (fields.game_id === undefined && config.crazy_game_game_id !== undefined) {
            fields.game_id = config.crazy_game_game_id;
        }
    }

    // Ensure game_id exists on active platform fields
    if (fields.game_id === undefined) {
        fields.game_id = '';
    }

    return fields;
}

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

    const activePlatformFields = _getActivePlatformFields(platform, __config_);

    const parts = ['pTS', 'game', 'config'];

    // JS generation
    let jsCode = `const _ = Object.create(null);\n`;
    jsCode += `_.version = ${JSON.stringify(versionStr)};\n`;
    jsCode += `_.prefix_key = ${JSON.stringify(prefixKey)};\n`;
    jsCode += `_.platform = ${JSON.stringify(platform)};\n`;

    for (const [k, v] of Object.entries(activePlatformFields)) {
        jsCode += `_.${k} = ${JSON.stringify(v)};\n`;
    }

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
    let dtsCode = `\ninterface _IData {\n   version: string;\n   prefix_key: string;\n   platform: string;\n`;
    for (const [k, v] of Object.entries(activePlatformFields)) {
        const typeStr = typeof v === 'number' ? 'number' : (typeof v === 'boolean' ? 'boolean' : 'string');
        dtsCode += `   ${k}: ${typeStr};\n`;
    }
    dtsCode += `   [key: string]: any;\n}\n\n`;

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

    try {
        const profile = await Editor.Profile.getProject(pkg.name) as any || {};
        Object.assign(__config_, profile);
    } catch (e) {}

    await _shippingProjectSettingPlugin();
}
