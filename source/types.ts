export interface _IThis {
    is_loaded: boolean;
}

export interface _IConfig {
    head_version?: number;
    sub_version?: number;
    tail_version?: number;
    prefix_key?: string;
    target_platform?: string;
    game_distribution_game_id?: string;
    tiktok_game_id?: string;
    crazy_game_game_id?: string;
    [key: string]: any;
}
