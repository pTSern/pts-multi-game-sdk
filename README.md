# `pts-multi-game-sdk` - Unified Multi-Platform Publisher & Ad SDK

> **Author**: pTSern  
> **Version**: `1.0.0`  
> **Cocos Creator Compatibility**: `>= 3.8.0`  
> **Category**: Publishing SDKs, Monetization & Storage

---

## 1. Overview

`pts-multi-game-sdk` provides a unified publisher SDK abstraction layer for HTML5 and instant game platforms. It decouples game logic from vendor-specific APIs by offering a standardized interface for:
* **Target Platforms**: **GameDistribution**, **TikTok Mini Games**, **CrazyGames**, and generic Web.
* **Monetization & Ads**: Unified lifecycle for rewarded video ads and interstitials with an automated fallback for editor/local testing (`NoSDK`).
* **Secure Storage**: Pluggable storage system featuring compression and obfuscation to prevent client-side data tampering on web portals.
* **Editor Integration**: Dockable panel for managing platform targets, Game IDs, and versioning without editing code.

---

## 2. Process Architecture & Topology

```
┌─────────────────────────────────────────────────────────────┐
│                 Editor Panel & Main Process                 │
│                                                             │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │ Multi-SDK Panel      │         │ Project Preferences  │  │
│  │ (source/panel.ts)    │         │ (profile.project)    │  │
│  └──────────┬───────────┘         └──────────┬───────────┘  │
│             │                                │              │
│             ▼                                ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Generates `assets/_$plugins/pts_game_config.js` & .d.ts│ │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Runtime Pipeline                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Ads_Manager (extends Event_Driver)                    │  │
│  │ - onSDKReady                                          │  │
│  │ - onShowRewardAds                                     │  │
│  │ - onShowRewardAdsComplete / Failed                    │  │
│  └──────────┬───────────────────────────────┬────────────┘  │
│             │                               │               │
│             ▼                               ▼               │
│  ┌──────────────────────┐       ┌────────────────────────┐  │
│  │ Platform SDK Adapter │       │ Storage_Manager        │  │
│  │ - GameDistribution   │       │ - Compression Provider │  │
│  │ - TikTok / CrazyGames│       │ - Normal Provider      │  │
│  │ - NoSDK (Dev Mock)   │       │ - Test/Prod Switching  │  │
│  └──────────────────────┘       └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Subsystems

### 3.1. Unified Ad Management (`assets/scripts/ads/`)

* **`Ads_Manager` (`ads/manager.ts`)**:
  * Inherits from `Event_Driver` (`pts-core`).
  * Provides a single API regardless of which portal the game is running on:
    * `showRewardAds()`: Requests a rewarded video ad.
    * `showInterstitial()`: Requests an interstitial break.
  * Dispatches standard lifecycle events:
    * `onSDKReady`: Portal SDK finished initialization.
    * `onShowRewardAds`: Ad playback began.
    * `onShowRewardAdsComplete`: Player watched the full ad (safe to grant reward!).
    * `onShowRewardAdsFailed`: Ad skipped, failed to load, or blocked.
* **`NoSDK` (`ads/NoSDK.ts`)**:
  * Active automatically in Editor Preview (`DEV` / `pConst.IS_TEST`) or when running standalone without an active portal.
  * Mocks instant ad completion or configurable delay, allowing developers to test reward flows seamlessly.
* **Platform Adapters**:
  * `GameDistribution.ts`: Hooks into `window.gdsdk`.
  * TikTok & CrazyGames bridges.

---

### 3.2. Secure & Compressed Storage (`assets/scripts/storage/`)

* **`Storage_Manager` (`storage/manager.ts`)**:
  * Selects between `pTestStorage` (in-memory or uncompressed for debugging) and `pProdStorage` based on `pConst.IS_TEST`.
* **`Compression` (`storage/Compression.ts`)**:
  * Compresses and obfuscates JSON strings before saving to `localStorage`.
  * Reduces storage footprint for complex game saves (e.g. inventory, level progression).
  * Prevents casual tampering via browser developer tools.
* **`Normal` (`storage/Normal.ts`)**:
  * Standard key-value storage implementation for simple non-sensitive flags.

---

### 3.3. Editor Control Panel (`source/panel.ts`)

* Access via **Extension -> pTS Multiple GameSDK -> Open Panel**.
* **Controls**:
  * **Target Platform**: Select from dropdown (`GameDistribution`, `TikTok`, `CrazyGames`, `Web`).
  * **Game IDs**: Dedicated fields for GameDistribution Game ID, TikTok Game ID, and CrazyGames Game ID.
  * **Version Configuration**: Head, Sub, and Tail version identifiers.
  * **Auto-Save**: Persists choices to project profile and regenerates `pts_game_config.js`.

---

## 4. Usage Example

### Rewarded Ad Request:
```typescript
import { _decorator, Component } from 'cc';
import { Ads_Manager } from 'db://pts-multi-game-sdk/scripts/ads/manager';

const { ccclass } = _decorator;

@ccclass('DailyRewardButton')
export class DailyRewardButton extends Component {
    public onWatchAdClicked() {
        const ads = Ads_Manager.instance;

        // One-time listener for ad completion
        ads.once('onShowRewardAdsComplete', () => {
            this.grantDoubleReward();
        }, this);

        ads.once('onShowRewardAdsFailed', () => {
            console.warn('Ad failed or skipped');
        }, this);

        ads.showRewardAds();
    }

    private grantDoubleReward() {
        console.log('Reward granted to player!');
    }
}
```

---

## 5. Integration with `pts-core`

* Leverages `Event_Driver` for ad event propagation.
* Utilizes `pConst.IS_TEST` to automatically switch between development mock ads/storage and live production SDKs.
* Typed global configuration injected via `assets/_$plugins/pts_game_config.d.ts`.
