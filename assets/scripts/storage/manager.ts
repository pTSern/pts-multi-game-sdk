import { _decorator, Component } from 'cc';
import { Storage_Base } from './storage';
import { pConst } from 'db://pts-core/scripts/utils';

const { ccclass, property } = _decorator;

@ccclass('Storage_Manager')
export class Storage_Manager extends Component {
    @property({ type: Storage_Base })
    pTestStorage: Storage_Base = null;

    @property({ type: Storage_Base })
    pProdStorage: Storage_Base = null;

    get storage() { return pConst.IS_TEST ? this.pTestStorage : this.pProdStorage }

    protected __preload(): void {
        this.storage.install();
    }
}
