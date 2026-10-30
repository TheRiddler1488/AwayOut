import { _decorator, Component, Vec3, tween, Tween } from 'cc';
import { PoolManager } from '../Managers/PoolManager';
import { EventBus } from '../Managers/EventBus';
const { ccclass, property } = _decorator;

@ccclass('ResourceNode')
export class ResourceNode extends Component {
    public static ActiveResources: ResourceNode[] = [];

    @property
    public maxHp: number = 3;

    @property
    public resourceType: string = 'log';

    @property
    public respawnTime: number = 3.0;

    private _currentHp: number = 0;
    private _posCache: Vec3 = new Vec3();

    private _originalScale: Vec3 = new Vec3();
    private _squashScale: Vec3 = new Vec3();
    private _originalPos: Vec3 = new Vec3();

    onLoad() {
        this.node.getScale(this._originalScale);
        this._squashScale.set(this._originalScale.x * 1.1, this._originalScale.y * 0.9, this._originalScale.z * 1.1);

        this.node.getPosition(this._originalPos);
    }

    onEnable() {
        this._currentHp = this.maxHp;
        ResourceNode.ActiveResources.push(this);
        this.node.setScale(this._originalScale);
    }

    onDisable() {
        let index = ResourceNode.ActiveResources.indexOf(this);
        if (index > -1) ResourceNode.ActiveResources.splice(index, 1);
    }

    public takeDamage(amount: number) {
        if (this._currentHp <= 0) return;

        if (this.resourceType === 'meat') {
            EventBus.emit('PLAY_SFX', 'bear', this.node.worldPosition);
        } else {
            EventBus.emit('PLAY_SFX', 'chop', this.node.worldPosition);
        }

        this._currentHp -= amount;

        Tween.stopAllByTarget(this.node);
        tween(this.node).to(0.05, { scale: this._squashScale }).to(0.1, { scale: this._originalScale }, { easing: 'bounceOut' }).start();

        if (this._currentHp <= 0) {
            this.dieAndDrop();
        }
    }

    private dieAndDrop() {
        this.node.getWorldPosition(this._posCache);
        PoolManager.Instance.spawnResource(this.resourceType, this._posCache);

        Tween.stopAllByTarget(this.node);
        this.node.setScale(this._originalScale);

        this.node.active = false;

        setTimeout(() => {
            if (this.node && this.node.isValid) {
                Tween.stopAllByTarget(this.node);

                this.node.setPosition(this._originalPos);
                this.node.active = true;
                this._currentHp = this.maxHp;
            }
        }, this.respawnTime * 1000);
    }
}
