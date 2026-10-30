import { _decorator, Component, Node, Collider, ITriggerEvent, Vec3, tween, Tween } from 'cc';
import { PoolManager } from '../Managers/PoolManager';
import { EventBus, GameEvents } from '../Managers/EventBus';
const { ccclass, property } = _decorator;

@ccclass('CashZone')
export class CashZone extends Component {
    @property(Node)
    public stackCenter: Node = null;

    @property
    public itemHeight: number = 0.5;

    private _storedCash: Node[] = [];
    private _isCollecting: boolean = false;

    onEnable() {
        let collider = this.getComponent(Collider);
        if (collider) collider.on('onTriggerEnter', this.onTriggerEnter, this);
    }

    public addCash() {
        let cashNode = PoolManager.Instance.spawnResource('cash', this.node.worldPosition);
        if (!cashNode) return;

        cashNode.setParent(this.stackCenter);
        this._storedCash.push(cashNode);

        let targetY = (this._storedCash.length - 1) * this.itemHeight;

        Tween.stopAllByTarget(cashNode);
        tween(cashNode)
            .to(0.3, {
                position: new Vec3(0, targetY, 0),
                scale: new Vec3(0.8, 0.8, 0.8)
            })
            .start();
    }

    private onTriggerEnter(event: ITriggerEvent) {
        if (event.otherCollider.node.name === 'Player' && !this._isCollecting && this._storedCash.length > 0) {
            this._isCollecting = true;
            this.collectAll();
        }
    }

    private collectAll() {
        let delay = 0;
        let tempArray = [...this._storedCash];
        this._storedCash = [];

        for (let i = tempArray.length - 1; i >= 0; i--) {
            let cashNode = tempArray[i];

            tween(cashNode)
                .delay(delay)
                .to(0.1, { scale: Vec3.ZERO })
                .call(() => {
                    PoolManager.Instance.returnResource(cashNode);

                    EventBus.emit('SPAWN_UI_CASH', cashNode.worldPosition);
                    EventBus.emit(GameEvents.MONEY_COLLECTED, 15);
                })
                .start();

            delay += 0.05;
        }

        setTimeout(
            () => {
                this._isCollecting = false;
            },
            delay * 1000 + 100
        );
    }
}
