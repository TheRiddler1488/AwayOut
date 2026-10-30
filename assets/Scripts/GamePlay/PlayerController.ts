import { _decorator, Component, Vec3, RigidBody } from 'cc';
import { EventBus, GameEvents } from '../Managers/EventBus';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property
    public speed: number = 15;

    private _rigidBody: RigidBody = null;
    private _moveDir: Vec3 = new Vec3();

    private _velocity: Vec3 = new Vec3();

    private _currentVelocity: Vec3 = new Vec3();

    onLoad() {
        this._rigidBody = this.getComponent(RigidBody);
    }

    onEnable() {
        EventBus.on(GameEvents.JOYSTICK_MOVE, this.onJoystickMove, this);
    }

    onDisable() {
        EventBus.off(GameEvents.JOYSTICK_MOVE, this.onJoystickMove, this);
    }

    private onJoystickMove(dir: Vec3) {
        this._moveDir.set(dir);
    }

    update(dt: number) {
        if (!this._rigidBody) return;

        this._rigidBody.getLinearVelocity(this._currentVelocity);

        this._velocity.set(this._moveDir.x * this.speed, this._currentVelocity.y, -this._moveDir.y * this.speed);

        this._rigidBody.setLinearVelocity(this._velocity);

        if (this._moveDir.x !== 0 || this._moveDir.y !== 0) {
            let angle = Math.atan2(this._velocity.x, this._velocity.z) * (180 / Math.PI);
            this.node.setRotationFromEuler(0, angle, 0);
        }
    }
}
