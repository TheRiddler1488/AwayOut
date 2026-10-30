import { _decorator, Component, Node, Camera, Vec3, tween, instantiate, Prefab, UITransform, Label } from 'cc';
import { EventBus } from '../Managers/EventBus';
const { ccclass, property } = _decorator;

@ccclass('UIWallet')
export class UIWallet extends Component {
    public static Balance: number = 0;

    @property(Camera)
    public mainCamera: Camera = null;

    @property(Prefab)
    public uiCashPrefab: Prefab = null;

    @property(Node)
    public walletIcon: Node = null;

    @property(Label)
    public balanceLabel: Label = null;

    private _screenPos: Vec3 = new Vec3();
    private _uiPos: Vec3 = new Vec3();
    private _uiTransform: UITransform = null;

    private _iconBaseScale: Vec3 = new Vec3();
    private _labelBaseScale: Vec3 = new Vec3();

    onLoad() {
        this._uiTransform = this.getComponent(UITransform);

        UIWallet.Balance = 0;
        if (this.balanceLabel) this.balanceLabel.string = UIWallet.Balance.toString();

        if (this.walletIcon) this.walletIcon.getScale(this._iconBaseScale);
        if (this.balanceLabel) this.balanceLabel.node.getScale(this._labelBaseScale);
    }

    onEnable() {
        EventBus.on('SPAWN_UI_CASH', this.onSpawnUICash, this);
        EventBus.on('MONEY_SPENT', this.onMoneySpent, this);
    }

    onDisable() {
        EventBus.off('SPAWN_UI_CASH', this.onSpawnUICash, this);
        EventBus.off('MONEY_SPENT', this.onMoneySpent, this);
    }

    private onMoneySpent(amount: number) {
        if (this.balanceLabel) {
            this.balanceLabel.string = UIWallet.Balance.toString();
        }
    }

    private onSpawnUICash(worldPos: Vec3, amountToGive: number = 15) {
        if (!this.mainCamera || !this.uiCashPrefab || !this._uiTransform) return;

        this.mainCamera.worldToScreen(worldPos, this._screenPos);
        this._uiTransform.convertToNodeSpaceAR(this._screenPos, this._uiPos);

        let uiCash = instantiate(this.uiCashPrefab);
        uiCash.setParent(this.node);
        uiCash.setPosition(this._uiPos);

        let startScale = new Vec3();
        uiCash.getScale(startScale);

        tween(uiCash)
            .to(
                0.4,
                {
                    position: this.walletIcon.position,
                    scale: new Vec3(startScale.x * 0.3, startScale.y * 0.3, 1)
                },
                { easing: 'cubicIn' }
            )
            .call(() => {
                uiCash.destroy();
                EventBus.emit('PLAY_SFX', 'money');

                UIWallet.Balance += amountToGive;
                if (this.balanceLabel) {
                    this.balanceLabel.string = UIWallet.Balance.toString();
                }

                let iconPop = new Vec3(this._iconBaseScale.x * 1.2, this._iconBaseScale.y * 1.2, 1);
                let labelPop = new Vec3(this._labelBaseScale.x * 1.2, this._labelBaseScale.y * 1.2, 1);

                tween(this.walletIcon).to(0.1, { scale: iconPop }).to(0.1, { scale: this._iconBaseScale }).start();

                if (this.balanceLabel) {
                    tween(this.balanceLabel.node).to(0.1, { scale: labelPop }).to(0.1, { scale: this._labelBaseScale }).start();
                }
            })
            .start();
    }
}
