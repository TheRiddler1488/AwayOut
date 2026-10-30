import { _decorator, Component, Vec3, Node } from 'cc';
import { ResourceNode } from './ResourceNode';
import { UnitStack } from './UnitStack';
import { PoolManager } from '../Managers/PoolManager';
const { ccclass, property } = _decorator;

@ccclass('HunterAI')
export class HunterAI extends Component {
    @property(Node)
    public meatWarehouseNode: Node = null;

    @property
    public moveSpeed: number = 3.5;

    @property(Node)
    public workZoneCenter: Node = null;

    @property
    public workZoneRadius: number = 15.0;

    private _myStack: UnitStack = null;
    private _targetPos: Vec3 = new Vec3();
    private _myPos: Vec3 = new Vec3();
    private _moveDir: Vec3 = new Vec3();
    private _tempVec: Vec3 = new Vec3();

    onLoad() {
        this._myStack = this.getComponent(UnitStack);
    }

    update(dt: number) {
        if (this._myStack.isFull()) {
            if (this.meatWarehouseNode) {
                this.meatWarehouseNode.getPosition(this._targetPos);
            }
        } else {
            let foundMeat = this.findNearestDroppedMeat();
            if (!foundMeat) {
                this.findNearestBear();
            }
        }

        this.moveToTarget(dt);
    }

    private findNearestDroppedMeat(): boolean {
        this.node.getPosition(this._myPos);
        let minDist = Infinity;
        let nearestMeat: Node = null;

        let allDropped = PoolManager.Instance.node.children;
        for (let i = 0; i < allDropped.length; i++) {
            let item = allDropped[i];
            if (item.active && item.name === 'DroppedMeat') {
                if (this.workZoneCenter) {
                    let distToZone = Vec3.distance(item.worldPosition, this.workZoneCenter.worldPosition);
                    if (distToZone > this.workZoneRadius) continue;
                }

                item.getPosition(this._tempVec);
                let dist = Vec3.squaredDistance(this._myPos, this._tempVec);
                if (dist < minDist) {
                    minDist = dist;
                    nearestMeat = item;
                }
            }
        }

        if (nearestMeat) {
            nearestMeat.getPosition(this._targetPos);
            return true;
        }
        return false;
    }

    private findNearestBear() {
        this.node.getPosition(this._myPos);
        let minDist = Infinity;
        let nearestNode: Node = null;

        for (let i = 0; i < ResourceNode.ActiveResources.length; i++) {
            let res = ResourceNode.ActiveResources[i];
            if (res.resourceType !== 'meat') continue;

            if (this.workZoneCenter) {
                let distToZone = Vec3.distance(res.node.worldPosition, this.workZoneCenter.worldPosition);
                if (distToZone > this.workZoneRadius) continue;
            }

            res.node.getPosition(this._tempVec);
            let dist = Vec3.squaredDistance(this._myPos, this._tempVec);
            if (dist < minDist) {
                minDist = dist;
                nearestNode = res.node;
            }
        }

        if (nearestNode) {
            nearestNode.getPosition(this._targetPos);
        } else {
            this._targetPos.set(this._myPos);
        }
    }

    private moveToTarget(dt: number) {
        this.node.getPosition(this._myPos);
        this._targetPos.y = this._myPos.y;

        if (Vec3.squaredDistance(this._myPos, this._targetPos) < 0.5) return;

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
