import { _decorator, Component, Vec3, Node } from 'cc';
import { ResourceNode } from './ResourceNode';
import { UnitStack } from './UnitStack';
import { PoolManager } from '../Managers/PoolManager';
const { ccclass, property } = _decorator;

@ccclass('LumberjackAI')
export class LumberjackAI extends Component {
    @property(Node)
    public warehouseNode: Node = null;

    @property
    public moveSpeed: number = 3.0;

    @property(Node)
    public workZoneCenter: Node = null;

    @property
    public workZoneRadius: number = 25.0;

    private _myStack: UnitStack = null;
    private _targetPos: Vec3 = new Vec3();
    private _myPos: Vec3 = new Vec3();
    private _moveDir: Vec3 = new Vec3();
    private _tempVec: Vec3 = new Vec3();

    private _isUnloading: boolean = false;
    private _chopTimer: number = 0;

    onLoad() {
        this._myStack = this.getComponent(UnitStack);
    }

    update(dt: number) {
        if (!this._myStack) return;

        if (this._myStack.isFull()) {
            this._isUnloading = true;
        }

        if (this._isUnloading) {
            let isEmpty = this._myStack.collectedLogs.length === 0 && this._myStack.collectedMeat.length === 0;

            if (isEmpty) {
                this._isUnloading = false;
            } else {
                if (this.warehouseNode) {
                    this.warehouseNode.getWorldPosition(this._targetPos);
                    this.moveToTarget(this._targetPos, dt, 0.2, null);
                }
                return;
            }
        }

        let targetNode = this.findNearestDroppedLog();

        if (!targetNode) {
            targetNode = this.findNearestTree();
        }

        if (targetNode) {
            targetNode.getWorldPosition(this._targetPos);

            let stopDist = targetNode.name === 'DroppedLog' ? 0.3 : 0.6;
            this.moveToTarget(this._targetPos, dt, stopDist, targetNode);
        } else if (this.workZoneCenter) {
            this.workZoneCenter.getWorldPosition(this._targetPos);
            this.moveToTarget(this._targetPos, dt, 0.5, null);
        }
    }

    private findNearestDroppedLog(): Node {
        this.node.getWorldPosition(this._myPos);
        let minDist = Infinity;
        let nearest: Node = null;
        let allDropped = PoolManager.Instance.node.children;

        for (let i = 0; i < allDropped.length; i++) {
            let item = allDropped[i];
            if (item.active && item.name === 'DroppedLog') {
                if (this.workZoneCenter) {
                    let distToZone = Vec3.distance(item.worldPosition, this.workZoneCenter.worldPosition);
                    if (distToZone > this.workZoneRadius) continue;
                }
                item.getWorldPosition(this._tempVec);
                let dist = Vec3.squaredDistance(this._myPos, this._tempVec);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = item;
                }
            }
        }
        return nearest;
    }

    private findNearestTree(): Node {
        this.node.getWorldPosition(this._myPos);
        let minDist = Infinity;
        let nearest: Node = null;

        for (let i = 0; i < ResourceNode.ActiveResources.length; i++) {
            let res = ResourceNode.ActiveResources[i];
            if (!res.node || !res.node.active) continue;

            if (res.resourceType !== 'log') continue;

            if (this.workZoneCenter) {
                let distToZone = Vec3.distance(res.node.worldPosition, this.workZoneCenter.worldPosition);
                if (distToZone > this.workZoneRadius) continue;
            }

            res.node.getWorldPosition(this._tempVec);
            let dist = Vec3.squaredDistance(this._myPos, this._tempVec);
            if (dist < minDist) {
                minDist = dist;
                nearest = res.node;
            }
        }
        return nearest;
    }

    private moveToTarget(targetPos: Vec3, dt: number, stopDistance: number, targetNode: Node | null) {
        this.node.getWorldPosition(this._myPos);
        this._moveDir.set(targetPos);
        this._moveDir.y = this._myPos.y;

        let dist = Vec3.distance(this._myPos, this._moveDir);

        if (dist <= stopDistance) {
            if (targetNode && targetNode.name !== 'DroppedLog') {
                this._chopTimer += dt * 15;
                let wiggle = Math.sin(this._chopTimer) * 10;
                let baseAngle = Math.atan2(targetPos.x - this._myPos.x, targetPos.z - this._myPos.z) * (180 / Math.PI);
                this.node.setRotationFromEuler(0, baseAngle + wiggle, 0);
            }
            return;
        }

        Vec3.subtract(this._moveDir, this._moveDir, this._myPos);
        this._moveDir.y = 0;
        this._moveDir.normalize();

        let angle = Math.atan2(this._moveDir.x, this._moveDir.z) * (180 / Math.PI);
        this.node.setRotationFromEuler(0, angle, 0);

        this._tempVec.set(this._moveDir).multiplyScalar(this.moveSpeed * dt);
        this._myPos.add(this._tempVec);
        this.node.setWorldPosition(this._myPos);
    }
}
