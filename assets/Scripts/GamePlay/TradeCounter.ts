import { _decorator, Component, Collider, ITriggerEvent, Node, Vec3, instantiate, Prefab } from 'cc';
import { CustomerAI } from './CustomerAI';
import { EventBus, GameEvents } from '../Managers/EventBus';
import { UnitStack } from './UnitStack';
import { CashZone } from '../Managers/CashZone';
import { PoolManager } from '../Managers/PoolManager';
const { ccclass, property } = _decorator;

@ccclass('TradeCounter')
export class TradeCounter extends Component {
    @property(Prefab)
    public customerPrefab: Prefab = null;

    @property(Node)
    public queueStartPoint: Node = null;

    @property(CashZone)
    public cashZone: CashZone = null;

    @property(Vec3)
    public queueDirection: Vec3 = new Vec3(0, 0, 1);

    @property
    public queueSpacing: number = 2.0;

    @property
    public maxQueueSize: number = 5;

    private _queue: CustomerAI[] = [];
    private _playerStack: UnitStack = null;
    private _tradeCooldown: number = 0;
    private _spawnTimer: number = 0;
    private _tempPos: Vec3 = new Vec3();

    onEnable() {
        let collider = this.getComponent(Collider);
        if (collider) {
            collider.on('onTriggerEnter', this.onTriggerEnter, this);
            collider.on('onTriggerExit', this.onTriggerExit, this);
        }
    }

    private onTriggerEnter(event: ITriggerEvent) {
        if (event.otherCollider.node.name === 'Player') {
            this._playerStack = event.otherCollider.node.getComponent(UnitStack);
        }
    }

    private onTriggerExit(event: ITriggerEvent) {
        if (event.otherCollider.node.name === 'Player') this._playerStack = null;
    }

    public getNeededItemType(): string | null {
        if (this._queue.length > 0 && this._queue[0].isWaiting && this._queue[0].isAtCounter) {
            return this._queue[0].requestedItemType;
        }
        return null;
    }

    update(dt: number) {
        this.handleSpawning(dt);
        this.handleTrading(dt);
    }

    private handleSpawning(dt: number) {
        if (this._queue.length < this.maxQueueSize) {
            this._spawnTimer += dt;
            if (this._spawnTimer > 1.0) {
                this._spawnTimer = 0;
                this.spawnCustomer();
            }
        }
    }

    private spawnCustomer() {
        let node = instantiate(this.customerPrefab);
        node.setParent(this.node.parent);

        this.queueStartPoint.getPosition(this._tempPos);
        let spawnOffset = this.queueDirection.clone().multiplyScalar(20);
        this._tempPos.add(spawnOffset);
        node.setPosition(this._tempPos);

        let ai = node.getComponent(CustomerAI);
        let reqType = Math.random() > 0.5 ? 'meat' : 'log';

        this._queue.push(ai);

        let index = this._queue.length - 1;
        let targetPos = this.getQueuePosition(index);

        ai.init(reqType, targetPos);
        ai.isAtCounter = index === 0;
    }

    private getQueuePosition(index: number): Vec3 {
        let pos = this.queueStartPoint.getPosition();
        let offset = this.queueDirection.clone().multiplyScalar(index * this.queueSpacing);
        pos.add(offset);
        return pos;
    }

    private handleTrading(dt: number) {
        if (this._tradeCooldown > 0) {
            this._tradeCooldown -= dt;
            return;
        }

        if (this._playerStack && this._queue.length > 0) {
            let activeCustomer = this._queue[0];

            if (activeCustomer.isWaiting && activeCustomer.isAtCounter) {
                let neededType = activeCustomer.requestedItemType;
                let targetName = neededType === 'log' ? 'DroppedLog' : 'DroppedMeat';

                let itemNode = this._playerStack.extractSpecificItem(targetName);
                if (itemNode) {
                    this.deliverItem(itemNode);
                }
            }
        }
    }

    public deliverItem(itemNode: Node) {
        if (this._queue.length === 0) return;

        EventBus.emit('PLAY_SFX', 'sell', this.node.worldPosition);

        let activeCustomer = this._queue[0];

        PoolManager.Instance.returnResource(itemNode);

        if (this.cashZone) {
            this.cashZone.addCash();
        }

        activeCustomer.fulfillOrder();
        this._queue.shift();

        for (let i = 0; i < this._queue.length; i++) {
            let newPos = this.getQueuePosition(i);
            this._queue[i].advanceInQueue(newPos, i === 0);
        }

        this._tradeCooldown = 0.15;
    }
}
