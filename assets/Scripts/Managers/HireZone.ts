import { _decorator, Component, Collider, ITriggerEvent, Node, Label, ProgressBar } from 'cc';
import { EventBus } from './EventBus';
import { UIWallet } from '../UI/UIWallet';
const { ccclass, property } = _decorator;

@ccclass('HireZone')
export class HireZone extends Component {
    @property
    public cost: number = 50;

    @property
    public payInterval: number = 0.02;

    @property(Node)
    public workerToActivate: Node = null;

    @property(Label)
    public costLabel: Label = null;

    @property(ProgressBar)
    public progressBar: ProgressBar = null;

    private _isPlayerInZone: boolean = false;
    private _invested: number = 0;
    private _timer: number = 0;

    onLoad() {
        this.updateUI();
    }

    onEnable() {
        let collider = this.getComponent(Collider);
        if (collider) {
            collider.on(
                'onTriggerEnter',
                (e: ITriggerEvent) => {
                    if (e.otherCollider.node.name === 'Player') this._isPlayerInZone = true;
                },
                this
            );
            collider.on(
                'onTriggerExit',
                (e: ITriggerEvent) => {
                    if (e.otherCollider.node.name === 'Player') this._isPlayerInZone = false;
                },
                this
            );
        }
    }

    update(dt: number) {
        if (this._isPlayerInZone && this._invested < this.cost && UIWallet.Balance > 0) {
            this._timer += dt;

            if (this._timer > this.payInterval) {
                this._timer = 0;

                UIWallet.Balance--;
                EventBus.emit('MONEY_SPENT', 1);

                this._invested++;
                this.updateUI();

                if (this._invested >= this.cost) {
                    this.hireWorker();
                }
            }
        }
    }

    private updateUI() {
        let remaining = this.cost - this._invested;
        if (this.costLabel) {
            this.costLabel.string = remaining.toString();
        }
        if (this.progressBar) {
            this.progressBar.progress = this._invested / this.cost;
        }
    }

    private hireWorker() {
        if (this.workerToActivate) {
            this.workerToActivate.active = true;
        }
        this.node.active = false;
    }
}
