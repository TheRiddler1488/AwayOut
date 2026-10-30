import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraFollow')
export class CameraFollow extends Component {
    @property(Node)
    public target: Node = null;

    @property
    public offset: Vec3 = new Vec3(0, 12, 15);

    @property
    public smoothSpeed: number = 5.0;

    private _targetPos: Vec3 = new Vec3();
    private _currentPos: Vec3 = new Vec3();
    private _lookPos: Vec3 = new Vec3();

    lateUpdate(dt: number) {
        if (!this.target) return;

        this.target.getPosition(this._targetPos);
        this._targetPos.add(this.offset);

        this.node.getPosition(this._currentPos);
        Vec3.lerp(this._currentPos, this._currentPos, this._targetPos, this.smoothSpeed * dt);
        this.node.setPosition(this._currentPos);

        this.target.getPosition(this._lookPos);
        this._lookPos.y += 2.0;
        this.node.lookAt(this._lookPos);
    }
}
