import { _decorator, Component, Node, Vec3, Tween, tween } from 'cc';
const { ccclass, property } = _decorator;

enum BearState {
    IDLE,
    CHASE,
    ATTACK,
    STUN
}

@ccclass('BearAI')
export class BearAI extends Component {
    @property(Node)
    public playerNode: Node = null;

    @property(Node)
    public hunterNode: Node = null;

    @property
    public moveSpeed: number = 2.0;

    @property
    public aggroRadius: number = 4.0;

    @property
    public attackRadius: number = 1.0;

    private _currentState: BearState = BearState.IDLE;
    private _targetPos: Vec3 = new Vec3();
    private _myPos: Vec3 = new Vec3();
    private _moveDir: Vec3 = new Vec3();
    private _tempVec: Vec3 = new Vec3();

    private _currentTargetNode: Node = null;

    onEnable() {
        this._currentState = BearState.IDLE;
        this.node.setScale(Vec3.ONE);
    }

    update(dt: number) {
        if (this._currentState === BearState.STUN) return;

        this.node.getPosition(this._myPos);

        let closestDistSqr = Infinity;
        let newTarget: Node = null;

        if (this.playerNode && this.playerNode.active) {
            this.playerNode.getPosition(this._tempVec);
            let d = Vec3.squaredDistance(this._myPos, this._tempVec);
            if (d < closestDistSqr) {
                closestDistSqr = d;
                newTarget = this.playerNode;
            }
        }

        if (this.hunterNode && this.hunterNode.active) {
            this.hunterNode.getPosition(this._tempVec);
            let d = Vec3.squaredDistance(this._myPos, this._tempVec);
            if (d < closestDistSqr) {
                closestDistSqr = d;
                newTarget = this.hunterNode;
            }
        }

        this._currentTargetNode = newTarget;

        if (!this._currentTargetNode) {
            this._currentState = BearState.IDLE;
            return;
        }

        this._currentTargetNode.getPosition(this._targetPos);
        let distSqr = closestDistSqr;

        switch (this._currentState) {
            case BearState.IDLE:
                if (distSqr < this.aggroRadius * this.aggroRadius) {
                    this._currentState = BearState.CHASE;
                }
                break;

            case BearState.CHASE:
                if (distSqr < this.attackRadius * this.attackRadius) {
                    this._currentState = BearState.ATTACK;
                } else if (distSqr > this.aggroRadius * 1.5 * (this.aggroRadius * 1.5)) {
                    this._currentState = BearState.IDLE;
                } else {
                    this.moveTowardsTarget(dt);
                }
                break;

            case BearState.ATTACK:
                if (distSqr > this.attackRadius * this.attackRadius) {
                    this._currentState = BearState.CHASE;
                } else {
                    this.performAttack();
                }
                break;
        }
    }

    private moveTowardsTarget(dt: number) {
        Vec3.subtract(this._moveDir, this._targetPos, this._myPos);
        this._moveDir.y = 0;
        this._moveDir.normalize();

        let angle = Math.atan2(this._moveDir.x, this._moveDir.z) * (180 / Math.PI);
        this.node.setRotationFromEuler(0, angle, 0);

        this._tempVec.set(this._moveDir).multiplyScalar(this.moveSpeed * dt);
        this._myPos.add(this._tempVec);
        this.node.setPosition(this._myPos);
    }

    private performAttack() {}

    public takeHit(attackerPos: Vec3) {
        if (!this.node.active) return;

        this._currentState = BearState.STUN;

        Vec3.subtract(this._tempVec, this.node.worldPosition, attackerPos);
        this._tempVec.y = 0;
        this._tempVec.normalize().multiplyScalar(1.5);
        Vec3.add(this._tempVec, this.node.worldPosition, this._tempVec);

        Tween.stopAllByTarget(this.node);

        tween(this.node)
            .to(0.1, { position: this._tempVec, scale: new Vec3(1.2, 0.8, 1.2) })
            .to(0.15, { scale: Vec3.ONE }, { easing: 'bounceOut' })
            .call(() => {
                this._currentState = BearState.CHASE;
            })
            .start();
    }
}
