import { _decorator, Component, Vec3, Node } from 'cc';
import { Warehouse } from '../Managers/Warehouse';
import { TradeCounter } from './TradeCounter';
import { UnitStack } from './UnitStack';
const { ccclass, property } = _decorator;

enum SellerState {
    IDLE,
    TO_WAREHOUSE,
    TO_COUNTER
}

@ccclass('SellerAI')
export class SellerAI extends Component {
    @property(Warehouse)
    public logWarehouse: Warehouse = null;

    @property(Warehouse)
    public meatWarehouse: Warehouse = null;

    @property(TradeCounter)
    public tradeCounter: TradeCounter = null;

    @property
    public moveSpeed: number = 3.5;

    private _myStack: UnitStack = null;
    private _currentState: SellerState = SellerState.IDLE;
    private _targetItem: string = null;
    private _targetWarehouse: Warehouse = null;

    private _targetPos: Vec3 = new Vec3();
    private _myPos: Vec3 = new Vec3();
    private _moveDir: Vec3 = new Vec3();
    private _tempVec: Vec3 = new Vec3();

    onLoad() {
        this._myStack = this.getComponent(UnitStack);
    }

    update(dt: number) {
        switch (this._currentState) {
            case SellerState.IDLE:
                this.handleIdle();
                break;
            case SellerState.TO_WAREHOUSE:
                if (this._targetWarehouse) {
                    this.moveToTarget(this._targetWarehouse.node, dt, () => this.grabFromWarehouse());
                } else {
                    this._currentState = SellerState.IDLE;
                }
                break;
            case SellerState.TO_COUNTER:
                this.moveToTarget(this.tradeCounter.node, dt, () => this.sellToCounter());
                break;
        }
    }

    private handleIdle() {
        let neededItem = this.tradeCounter.getNeededItemType();
        if (neededItem) {
            this._targetWarehouse = neededItem === 'log' ? this.logWarehouse : this.meatWarehouse;

            if (this._targetWarehouse) {
                let count = this._targetWarehouse.getStoredCount();
                if (count > 0 && !this._myStack.isFull()) {
                    this._targetItem = neededItem;
                    this._currentState = SellerState.TO_WAREHOUSE;
                }
            }
        }
    }

    private grabFromWarehouse() {
        if (!this._targetWarehouse) {
            this._currentState = SellerState.IDLE;
            return;
        }

        let itemNode = this._targetWarehouse.takeItemForSale();
        if (itemNode) {
            this._myStack.pushItem(itemNode, false);
            this._currentState = SellerState.TO_COUNTER;
        } else {
            this._currentState = SellerState.IDLE;
        }
    }

    private sellToCounter() {
        let targetPrefabName = this._targetItem === 'log' ? 'DroppedLog' : 'DroppedMeat';
        let itemNode = this._myStack.extractSpecificItem(targetPrefabName);

        if (itemNode) {
            this.tradeCounter.deliverItem(itemNode);
        }

        this._currentState = SellerState.IDLE;
    }

    private moveToTarget(targetNode: Node, dt: number, onReach: Function) {
        this.node.getPosition(this._myPos);
        targetNode.getPosition(this._targetPos);

        this._targetPos.y = this._myPos.y;

        let distSqr = Vec3.squaredDistance(this._myPos, this._targetPos);

        if (distSqr < 0.5) {
            onReach();
            return;
        }

        Vec3.subtract(this._moveDir, this._targetPos, this._myPos);
        this._moveDir.y = 0;
        this._moveDir.normalize();

        let angle = Math.atan2(this._moveDir.x, this._moveDir.z) * (180 / Math.PI);
        this.node.setRotationFromEuler(0, angle, 0);

        this._tempVec.set(this._moveDir).multiplyScalar(this.moveSpeed * dt);
        this._myPos.add(this._tempVec);
        this.node.setPosition(this._myPos);
    }
}
