import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CustomerAI')
export class CustomerAI extends Component {
    @property(Node)
    public requirementBubble: Node = null;

    @property(Node)
    public iconLog: Node = null;

    @property(Node)
    public iconMeat: Node = null;

    public requestedItemType: string = 'meat';
    public isWaiting: boolean = false;
    public isAtCounter: boolean = false;

    private _targetPos: Vec3 = new Vec3();
    private _myPos: Vec3 = new Vec3();
    private _moveDir: Vec3 = new Vec3();
    private _isLeaving: boolean = false;

    public init(itemType: string, destination: Vec3) {
        this.requestedItemType = itemType;
        this._targetPos.set(destination);

        if (this.iconLog) this.iconLog.active = itemType === 'log';
        if (this.iconMeat) this.iconMeat.active = itemType === 'meat';

        this.requirementBubble.active = false;
        this.isWaiting = false;
        this.isAtCounter = false;
        this._isLeaving = false;
    }

    public advanceInQueue(newPos: Vec3, isFirst: boolean) {
        this._targetPos.set(newPos);
        this.isWaiting = false;
        this.isAtCounter = isFirst;
    }

    update(dt: number) {
        if (this.isWaiting) return;

        this.node.getPosition(this._myPos);
        let distSqr = Vec3.squaredDistance(this._myPos, this._targetPos);

        if (distSqr < 0.1) {
            if (this._isLeaving) {
                this.node.destroy();
                return;
            }

            this.isWaiting = true;
            this.requirementBubble.active = true;
        } else {
            Vec3.subtract(this._moveDir, this._targetPos, this._myPos);
            this._moveDir.y = 0;
            this._moveDir.normalize();

            let angle = Math.atan2(this._moveDir.x, this._moveDir.z) * (180 / Math.PI);
            this.node.setRotationFromEuler(0, angle, 0);

            this._moveDir.multiplyScalar(6.0 * dt);
            this._myPos.add(this._moveDir);
            this.node.setPosition(this._myPos);
        }
    }

    public fulfillOrder() {
        this.requirementBubble.active = false;
        this.isWaiting = false;
        this.isAtCounter = false;
        this._isLeaving = true;
        this._targetPos.set(-50, 0, 50);
    }
}
