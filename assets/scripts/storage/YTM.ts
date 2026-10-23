import { _decorator, js, game, Game } from "cc";
import { Storage_Base } from "./storage";
import { pGlobal } from "db://pts-core/scripts/utils";
import { editor_property } from "db://pts-core/scripts/utils/pClass";

const { ccclass, property, menu } = _decorator;

@ccclass('Storage_YTM')
@menu('SDK/Storage/YTM')
export class Storage_YTM extends Storage_Base {
    @property({ min: 0.1, tooltip: "Debounce delay in seconds" })
    threshold: number = 0.5;

    @property({ min: 1, tooltip: "Maximum wait time before forced save in seconds" })
    maxWait: number = 2.0;

    protected _data: Record<string, any> = js.createMap(true);
    protected _debounceTimer: any = null;
    @editor_property()
    protected _firstPendingTime: number = 0;
    @editor_property()
    protected _isDirty: boolean = false;
    @editor_property()
    protected _isSaving: boolean = false;

    protected _onLoad() {
        // Guarantee save on backgrounding or tab closing
        game.on(Game.EVENT_HIDE, this.flush, this);
        game.on(Game.EVENT_CLOSE, this.flush, this);
        if (typeof window !== "undefined") {
            window.addEventListener("pagehide", () => this.flush());
            window.addEventListener("beforeunload", () => this.flush());
        }
    }

    protected _onReleased() {
        this.flush();
        game.off(Game.EVENT_HIDE, this.flush, this);
        game.off(Game.EVENT_CLOSE, this.flush, this);
    }

    public async flush(): Promise<void> {
        if (!this._isDirty || typeof ytgame === "undefined" || !ytgame.game?.saveData) {
            return;
        }

        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }
        this._firstPendingTime = 0;
        this._isDirty = false;

        try {
            this._isSaving = true;
            const payload = JSON.stringify(this._data);
            await ytgame.game.saveData(payload);
            pGlobal.log({ group: "Storage", level: "DEV" }, "[YTM] >> Flushed to SDK successfully");
        } catch (error) {
            this._isDirty = true; // Re-mark dirty so next flush retries
            pGlobal.log({ group: "Storage", level: "ALL" }, "[YTM] >> Flush failed:", error);
        } finally {
            this._isSaving = false;
        }
    }

    protected _save() {
        this._isDirty = true;
        const now = Date.now();

        if (this._firstPendingTime === 0) {
            this._firstPendingTime = now;
        }

        // Check if maxWait exceeded (prevents infinite debounce starvation)
        const elapsed = (now - this._firstPendingTime) / 1000;
        if (elapsed >= this.maxWait) {
            this.flush();
            return;
        }

        // Cancel previous pending timer
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }

        // Schedule next execution
        this._debounceTimer = setTimeout(() => {
            this._debounceTimer = null;
            this.flush();
        }, this.threshold * 1000);
    }

    protected _creator(): pTS.bridge.ILinearCache<any> | pTS.bridge.ISyncCache<any> {
        const _storage = pTS.bridge.replican<Record<string, any>>({
            is_dict_mode: true,
            is_ambiguous: true,
            asynctify: {
                async set(k: string, v: any) {
                    try {
                        this._data[k] = v;
                        this._save();
                        pGlobal.log({ group: "Storage", level: "DEV" }, "[YTM] >> Set key:", k, "- Value:", v);
                    } catch (error) {
                        pGlobal.log({ group: "Storage", level: "ALL" }, "[YTM] >> Failed to set key:", k, error);
                    }
                },
                async get(k: string) {
                    return this._data[k] ?? null;
                },
            }
        });
        return _storage;
    }
}
