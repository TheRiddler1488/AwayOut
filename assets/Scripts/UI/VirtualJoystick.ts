import { _decorator, Component, Node, EventTouch, Vec3, UITransform } from 'cc';
import { EventBus, GameEvents } from '../Managers/EventBus';
const { ccclass, property } = _decorator;

@ccclass('VirtualJoystick')
export class VirtualJoystick extends Component {
    @property(Node)
    public joystickBase: Node = null;

    @property(Node)
    public stick: Node = null;

    @property
    public maxRadius: number = 75;

    private _startPos: Vec3 = new Vec3();
    private _movePos: Vec3 = new Vec3();
    private _dir: Vec3 = new Vec3();

    private _uiTransform: UITransform = null;
    private _localTapPos: Vec3 = new Vec3();

    onLoad() {
        this._uiTransform = this.getComponent(UITransform);

        if (this.joystickBase) {
            this.joystickBase.active = false;
        }

        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    private onTouchStart(event: EventTouch) {
        let loc = event.getUILocation();
        this._startPos.set(loc.x, loc.y, 0);

        if (this._uiTransform) {
            this._uiTransform.convertToNodeSpaceAR(this._startPos, this._localTapPos);
        } else {
            this._localTapPos.set(this._startPos);
        }

        if (this.joystickBase) {
            this.joystickBase.setPosition(this._localTapPos);
            this.joystickBase.active = true;
        }

        this.stick.setPosition(Vec3.ZERO);
    }

    private onTouchMove(event: EventTouch) {
        let loc = event.getUILocation();
        this._movePos.set(loc.x, loc.y, 0);

        Vec3.subtract(this._dir, this._movePos, this._startPos);

        let length = this._dir.length();
        if (length > this.maxRadius) {
            this._dir.normalize().multiplyScalar(this.maxRadius);
        }

        this.stick.setPosition(this._dir);

        this._dir.normalize();
        EventBus.emit(GameEvents.JOYSTICK_MOVE, this._dir);
    }

    private onTouchEnd(event: EventTouch) {
        this.stick.setPosition(Vec3.ZERO);

        if (this.joystickBase) {
            this.joystickBase.active = false;
        }

        EventBus.emit(GameEvents.JOYSTICK_MOVE, Vec3.ZERO);
    }
}
