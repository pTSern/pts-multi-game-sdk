declare namespace CrazyGames {
    type Environment = 'local' | 'crazygames' | 'disabled';
    type AdType = 'midgame' | 'rewarded';
    type DeviceType = 'desktop' | 'tablet' | 'mobile';

    interface AdCallbacks {
        adStarted?: () => void;
        adFinished?: () => void;
        adError?: (error: { code: string; message: string } | Error) => void;
    }

    interface BannerOptions {
        id: string;
        width: number;
        height: number;
    }

    interface GameSettings {
        disableChat: boolean;
        muteAudio: boolean;
    }

    interface User {
        username: string;
        profilePictureUrl: string;
    }

    interface SystemInfo {
        countryCode: string;
        device: {
            type: DeviceType;
        };
        os: {
            name: string;
            version: string;
        };
        browser: {
            name: string;
            version: string;
        };
    }

    interface RoomData {
        roomId: string;
        isJoinable: boolean;
        inviteParams?: Record<string, string>;
    }

    interface AdModule {
        requestAd(type: AdType, callbacks?: AdCallbacks): Promise<void>;
        hasAdblock(): Promise<boolean>;
    }

    interface BannerModule {
        requestBanner(options: BannerOptions): Promise<void>;
        requestResponsiveBanner(containerId: string): Promise<void>;
        clearBanner(containerId: string): void;
        clearAllBanners(): void;
    }

    interface GameModule {
        settings: GameSettings;
        inviteParams: Record<string, string> | null;
        isInstantMultiplayer: boolean;

        gameplayStart(): void;
        gameplayStop(): void;
        loadingStart(): void;
        loadingStop(): void;
        happytime(): void;

        addSettingsChangeListener(listener: (settings: GameSettings) => void): void;
        removeSettingsChangeListener(listener: (settings: GameSettings) => void): void;

        inviteLink(params: Record<string, string>): string;
        showInviteButton(params: Record<string, string>): void;
        hideInviteButton(): void;

        addJoinRoomListener(listener: (inviteParams: Record<string, string>) => void): void;
        removeJoinRoomListener(listener: (inviteParams: Record<string, string>) => void): void;

        updateRoom(roomData: RoomData): void;
        leftRoom(): void;
    }

    interface UserModule {
        isUserAccountAvailable: boolean;
        systemInfo: SystemInfo;

        getUser(): Promise<User | null>;
        getUserToken(): Promise<string>;
        showAuthPrompt(): Promise<User>;
        showAccountLinkPrompt(): Promise<unknown>;

        addAuthListener(listener: (user: User | null) => void): void;
        removeAuthListener(listener: (user: User | null) => void): void;
    }

    interface DataModule {
        clear(): Promise<void>;
        getItem(key: string): Promise<string | null>;
        setItem(key: string, value: string | number | boolean | object): Promise<void>;
        removeItem(key: string): Promise<void>;
    }

    interface AnalyticsModule {
        trackOrder(provider: 'xsolla' | string, order: Record<string, unknown>): void;
    }

    interface SDKInstance {
        environment: Environment;
        ad: AdModule;
        banner: BannerModule;
        game: GameModule;
        user: UserModule;
        data: DataModule;
        analytics: AnalyticsModule;

        init( { wrapper: { engine: string, sdkVersion: string } } ): Promise<void>;
    }

    const SDK: SDKInstance;
}

