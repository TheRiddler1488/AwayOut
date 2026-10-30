import { _decorator, Component, Node, Collider, ITriggerEvent, Vec3, tween, Tween, Label, ProgressBar } from 'cc';
import { UnitStack } from '../GamePlay/UnitStack';
import { EventBus, GameEvents } from './EventBus';
const { ccclass, property } = _decorator;

@ccclass('UnlockZone')
export class UnlockZone extends Component {
    @property
    public resourceType: string = 'log';

    @property
    public requiredAmount: number = 20;

    @property({ tooltip: 'Поставь галочку, если покупка этой зоны вызывает финал (CTA)' })
    public isFinalZone: boolean = false;

    @property([Node])
    public targetsToUnlock: Node[] = [];

    @property(Label)
    public costLabel: Label = null;

    @property(ProgressBar)
    public progressBar: ProgressBar = null;

    private _currentPaid: number = 0;
    private _playerStack: UnitStack | null = null;

    private _payTimer: number = 0;
    private _payInterval: number = 0.1;

    private _targetPos: Vec3 = new Vec3();
    private _targetScales: Vec3[] = [];

    onLoad() {
        for (let i = 0; i < this.targetsToUnlock.length; i++) {
            let node = this.targetsToUnlock[i];
            if (node) {
                let scaleCache = new Vec3();
                node.getScale(scaleCache);
                this._targetScales.push(scaleCache);
                node.active = false;
            }
        }
        this.updateUI();
    }

    onEnable() {
        let col = this.getComponent(Collider);
        if (col) {
            col.on('onTriggerEnter', this.onEnterZone, this);
            col.on('onTriggerExit', this.onExitZone, this);
        }
    }

    onDisable() {
        let col = this.getComponent(Collider);
        if (col) {
            col.off('onTriggerEnter', this.onEnterZone, this);
            col.off('onTriggerExit', this.onExitZone, this);
        }
    }

    private onEnterZone(event: ITriggerEvent) {
        let otherNode = event.otherCollider.node;
        if (otherNode.name === 'Player') {
            let stack = otherNode.getComponent(UnitStack);
            if (stack) {
                this._playerStack = stack;
            }
        }
    }

    private onExitZone(event: ITriggerEvent) {
        if (this._playerStack && event.otherCollider.node === this._playerStack.node) {
            this._playerStack = null;
        }
    }

    update(dt: number) {
        if (!this._playerStack || this._currentPaid >= this.requiredAmount) return;

        this._payTimer += dt;
        if (this._payTimer >= this._payInterval) {
            this._payTimer = 0;
            this.processPayment();
        }
    }

    private processPayment() {
        let item = this._playerStack.popAnyItem(this.resourceType);
        if (!item) return;

        let isCorrectType = (this.resourceType === 'log' && item.name === 'DroppedLog') || (this.resourceType === 'meat' && item.name === 'DroppedMeat');

        if (!isCorrectType) {
            this._playerStack.pushItem(item, false);
            return;
        }

        this._currentPaid++;
        EventBus.emit('PLAY_SFX', 'drop');
        this.updateUI();

        EventBus.emit('PLAY_SFX', 'drop');

        item.setParent(this.node, true);
        this._targetPos.set(0, 0.5, 0);

        Tween.stopAllByTarget(item);
        tween(item)
            .to(0.2, { position: this._targetPos, scale: new Vec3(0.1, 0.1, 0.1) })
            .call(() => {
                item.active = false;
                this.checkUnlock();
            })
            .start();
    }

    private updateUI() {
        let remaining = this.requiredAmount - this._currentPaid;
        if (this.costLabel) {
            this.costLabel.string = remaining.toString();
        }
        if (this.progressBar) {
            this.progressBar.progress = this._currentPaid / this.requiredAmount;
        }
    }

    private checkUnlock() {
        if (this._currentPaid >= this.requiredAmount) {
            EventBus.emit('PLAY_SFX', 'unlock');

            for (let i = 0; i < this.targetsToUnlock.length; i++) {
                let node = this.targetsToUnlock[i];
                if (node) {
                    node.active = true;
                    node.setScale(new Vec3(0.1, 0.1, 0.1));
                    tween(node).to(0.4, { scale: this._targetScales[i] }, { easing: 'backOut' }).start();
                }
            }

            if (this.isFinalZone) {
                EventBus.emit(GameEvents.OPEN_CTA);
            }

            this.node.active = false;
        }
    }
}
