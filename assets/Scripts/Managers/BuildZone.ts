import { _decorator, Component, Collider, ITriggerEvent, ProgressBar, Node, Label } from 'cc';
import { EventBus, GameEvents } from '../Managers/EventBus';
import { UIWallet } from '../UI/UIWallet';
const { ccclass, property } = _decorator;

@ccclass('BuildZone')
export class BuildZone extends Component {
    @property
    public requiredMoney: number = 50;

    @property
    public payInterval: number = 0.02;

    @property({ tooltip: 'Поставь галочку, если покупка вызывает финал (CTA)' })
    public isFinalZone: boolean = false;

    @property(Node)
    public buildingToActivate: Node = null;

    @property(Label)
    public costLabel: Label = null;

    @property(ProgressBar)
    public buildProgress: ProgressBar = null;

    private _isPlayerInZone: boolean = false;
    private _investedMoney: number = 0;
    private _timer: number = 0;

    onLoad() {
        this.updateUI();
    }

    onEnable() {
        let collider = this.getComponent(Collider);
        if (collider) {
            collider.on('onTriggerEnter', this.onTriggerEnter, this);
            collider.on('onTriggerExit', this.onTriggerExit, this);
        }
    }

    private onTriggerEnter(event: ITriggerEvent) {
        if (event.otherCollider.node.name === 'Player') this._isPlayerInZone = true;
    }

    private onTriggerExit(event: ITriggerEvent) {
        if (event.otherCollider.node.name === 'Player') this._isPlayerInZone = false;
    }

    update(dt: number) {
        if (this._isPlayerInZone && this._investedMoney < this.requiredMoney && UIWallet.Balance > 0) {
            this._timer += dt;
            if (this._timer > this.payInterval) {
                this._timer = 0;

                UIWallet.Balance--;
                EventBus.emit('MONEY_SPENT', 1);

                this._investedMoney++;
                this.updateUI();

                if (this._investedMoney >= this.requiredMoney) {
                    this.completeBuild();
                }
            }
        }
    }

    private updateUI() {
        let remaining = this.requiredMoney - this._investedMoney;
        if (this.costLabel) {
            this.costLabel.string = remaining.toString();
        }
        if (this.buildProgress) {
            this.buildProgress.progress = this._investedMoney / this.requiredMoney;
        }
    }

    private completeBuild() {
        if (this.buildingToActivate) {
            this.buildingToActivate.active = true;
        }

        if (this.isFinalZone) {
            EventBus.emit(GameEvents.OPEN_CTA);
        }

        this.node.active = false;
    }
}
