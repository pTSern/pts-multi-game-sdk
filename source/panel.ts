import pkg from '../package.json';

export const template = `
<button class="toggle-btn">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
</button>

<div class="dark-screen"></div>

<div class="side-bar-popup">
    <div class="sidebar-title">SDK Manager</div>
    <div class="sidebar-item active" data-tab="1">Data Manager</div>
    <div class="sidebar-item" data-tab="2">Options</div>
    <div class="sidebar-item" data-tab="3">Game Distribution</div>
</div>

<div class="main-content">
    <div class="tab-content tab-content-1" style="display: flex;">
        <h3>Data Manager</h3>
        <ui-prop>
            <ui-label slot="label">Head Version</ui-label>
            <ui-num-input slot="content" class="head-version" min="0" step="1"></ui-num-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">Sub Version</ui-label>
            <ui-num-input slot="content" class="sub-version" min="0" step="1" max="9"></ui-num-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">Tail Version</ui-label>
            <ui-num-input slot="content" class="tail-version" min="0" step="1" max="9"></ui-num-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">Prefix Key</ui-label>
            <ui-input slot="content" class="prefix-key" show-clear placeholder="Prefix of the key"></ui-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">Target Platform</ui-label>
            <ui-select slot="content" class="target-platform">
                <option value="game_distribution">Game Distribution</option>
                <option value="tiktok">TikTok</option>
                <option value="crazy_game">Crazy Game</option>
            </ui-select>
        </ui-prop>
    </div>

    <div class="tab-content tab-content-2" style="display: none;">
        <h3>Options</h3>
        <ui-prop>
            <ui-label slot="label">Global Variable Key</ui-label>
            <ui-input slot="content" class="global-variable-key" show-clear></ui-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">Storage Location</ui-label>
            <ui-select slot="content" class="storage-location">
                <option value="null">Nothing</option>
                <option value="local">Local</option>
                <option value="global">Global</option>
            </ui-select>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">Plugin Name</ui-label>
            <ui-input slot="content" class="plugin-name" show-clear></ui-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">Plugin Location</ui-label>
            <ui-file slot="content" class="plugin-location" type="directory" protocols="project"></ui-file>
        </ui-prop>
    </div>

    <div class="tab-content tab-content-3" style="display: none;">
        <h3>Game Distribution</h3>
        <ui-prop>
            <ui-label slot="label">Game ID</ui-label>
            <ui-input slot="content" class="game-id" show-clear placeholder="Place your game id here"></ui-input>
        </ui-prop>
    </div>

    <ui-button class="save-btn" type="primary" style="margin-top: 20px; align-self: flex-start;">Save</ui-button>
</div>
`;

export const style = `
:host {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    color: #dedede;
    box-sizing: border-box;
}

.toggle-btn {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 32px;
    height: 32px;
    z-index: 100;
    background: #3a3a3a;
    border: 1px solid #555;
    border-radius: 4px;
    color: #dedede;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
}
.toggle-btn:hover {
    background: #4a4a4a;
    border-color: #777;
}

.dark-screen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 98;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(3px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.dark-screen.show {
    opacity: 1;
    pointer-events: auto;
}

.side-bar-popup {
    position: absolute;
    top: 0;
    left: -210px;
    width: 200px;
    height: 100%;
    z-index: 99;
    background: rgba(30, 30, 30, 0.9);
    backdrop-filter: blur(12px);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    padding: 60px 0 20px 0;
    box-sizing: border-box;
    transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 5px 0 25px rgba(0,0,0,0.5);
}
.side-bar-popup.show {
    left: 0;
}

.sidebar-title {
    font-size: 12px;
    font-weight: bold;
    padding: 0 20px 15px 20px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    margin-bottom: 10px;
}

.sidebar-item {
    padding: 12px 20px;
    font-size: 13px;
    color: #bbb;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-left-color 0.15s;
    border-left: 3px solid transparent;
}
.sidebar-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
}
.sidebar-item.active {
    color: #3f90ff;
    background: rgba(63, 144, 255, 0.08);
    border-left-color: #3f90ff;
    font-weight: 500;
}

.main-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    padding: 55px 15px 15px 15px;
    box-sizing: border-box;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.tab-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.tab-content h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    color: #fff;
    border-bottom: 1px solid #333;
    padding-bottom: 8px;
}

ui-prop {
    margin-bottom: 4px;
}
`;

export const $ = {
    toggleBtn: '.toggle-btn',
    darkScreen: '.dark-screen',
    sidebar: '.side-bar-popup',
    mainContent: '.main-content',
    headVersion: '.head-version',
    subVersion: '.sub-version',
    tailVersion: '.tail-version',
    prefixKey: '.prefix-key',
    targetPlatform: '.target-platform',
    globalVariableKey: '.global-variable-key',
    storageLocation: '.storage-location',
    pluginName: '.plugin-name',
    pluginLocation: '.plugin-location',
    gameId: '.game-id',
    saveBtn: '.save-btn',
    sidebarItem1: '.sidebar-item[data-tab="1"]',
    sidebarItem2: '.sidebar-item[data-tab="2"]',
    sidebarItem3: '.sidebar-item[data-tab="3"]',
    tabContent1: '.tab-content-1',
    tabContent2: '.tab-content-2',
    tabContent3: '.tab-content-3',
};

let activePanel: any = null;

async function updateUIValues(thisAny: any) {
    const profile = await Editor.Profile.getProject(pkg.name) as any || {};

    if (thisAny.$.headVersion) thisAny.$.headVersion.value = profile.head_version ?? 1;
    if (thisAny.$.subVersion) thisAny.$.subVersion.value = profile.sub_version ?? 0;
    if (thisAny.$.tailVersion) thisAny.$.tailVersion.value = profile.tail_version ?? 1;
    if (thisAny.$.prefixKey) thisAny.$.prefixKey.value = profile.prefix_key ?? 'game$_$';
    if (thisAny.$.targetPlatform) thisAny.$.targetPlatform.value = profile.target_platform ?? 'game_distribution';

    if (thisAny.$.globalVariableKey) thisAny.$.globalVariableKey.value = profile.global_variable_key_mg ?? 'pTS.settings';
    if (thisAny.$.storageLocation) thisAny.$.storageLocation.value = profile.storage_location ?? 'null';
    if (thisAny.$.pluginName) thisAny.$.pluginName.value = profile.plugin_name_mg ?? '_game_data_manager';
    if (thisAny.$.pluginLocation) thisAny.$.pluginLocation.value = profile.plugin_location_mg ?? '';

    if (thisAny.$.gameId) thisAny.$.gameId.value = profile.game_distribution_game_id ?? '';
}

const onWindowFocus = () => {
    if (activePanel) {
        updateUIValues(activePanel);
    }
};

export const ready = async function(this: any) {
    activePanel = this;

    // Select options are defined inline in the template via <option> elements

    // Load initial values
    await updateUIValues(this);

    // Sync on window focus in case setting changes in the settings panel
    window.addEventListener('focus', onWindowFocus);

    // Sidebar Toggling
    this.$.toggleBtn?.addEventListener('click', () => {
        const isOpen = this.$.sidebar.classList.toggle('show');
        this.$.darkScreen.classList.toggle('show', isOpen);
    });

    this.$.darkScreen?.addEventListener('click', () => {
        this.$.sidebar.classList.remove('show');
        this.$.darkScreen.classList.remove('show');
    });

    // Tab Switching
    const sidebarItems = [this.$.sidebarItem1, this.$.sidebarItem2, this.$.sidebarItem3];
    const tabContents = [this.$.tabContent1, this.$.tabContent2, this.$.tabContent3];

    sidebarItems.forEach((item: any, index: number) => {
        if (!item) return;
        item.addEventListener('click', () => {
            sidebarItems.forEach((i: any) => i?.classList.remove('active'));
            item.classList.add('active');

            tabContents.forEach((content: any) => {
                if (content) content.style.display = 'none';
            });
            const targetContent = tabContents[index];
            if (targetContent) targetContent.style.display = 'flex';

            this.$.sidebar.classList.remove('show');
            this.$.darkScreen.classList.remove('show');
        });
    });

    const save = async (key: string, value: any, messageName?: string) => {
        await Editor.Profile.setProject(pkg.name, key, value);
        if (messageName) {
            await Editor.Message.send(pkg.name, messageName, key, value);
        }
    };

    // Listeners for Data Manager
    this.$.headVersion?.addEventListener('change', () => {
        save('head_version', this.$.headVersion.value, 'profile::project::changed');
    });
    this.$.subVersion?.addEventListener('change', () => {
        save('sub_version', this.$.subVersion.value, 'profile::project::changed');
    });
    this.$.tailVersion?.addEventListener('change', () => {
        save('tail_version', this.$.tailVersion.value, 'profile::project::changed');
    });
    this.$.prefixKey?.addEventListener('confirm', () => {
        save('prefix_key', this.$.prefixKey.value, 'profile::project::changed');
    });
    this.$.targetPlatform?.addEventListener('change', () => {
        save('target_platform', this.$.targetPlatform.value, 'profile::project::target_platform_changed');
    });

    // Listeners for Options
    this.$.globalVariableKey?.addEventListener('confirm', () => {
        save('global_variable_key_mg', this.$.globalVariableKey.value, 'profile::project::changed');
    });
    this.$.storageLocation?.addEventListener('change', () => {
        save('storage_location', this.$.storageLocation.value, 'profile::project::changed');
    });
    this.$.pluginName?.addEventListener('confirm', () => {
        save('plugin_name_mg', this.$.pluginName.value, 'profile::project::changed_location');
    });
    this.$.pluginLocation?.addEventListener('confirm', () => {
        save('plugin_location_mg', this.$.pluginLocation.value, 'profile::project::changed_location');
    });

    // Listeners for Game Distribution
    this.$.gameId?.addEventListener('confirm', () => {
        save('game_distribution_game_id', this.$.gameId.value, 'profile::project::game_distribution::changed_game_id');
    });

    // Save Button
    this.$.saveBtn?.addEventListener('click', () => {
        Editor.Message.send(pkg.name, 'profile::project::save');
    });
};

export const close = function(this: any) {
    window.removeEventListener('focus', onWindowFocus);
    activePanel = null;
};
