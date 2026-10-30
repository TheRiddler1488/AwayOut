import { _decorator, Component, Collider, ITriggerEvent } from 'cc';
import { ResourceNode } from './ResourceNode';
import { BearAI } from './BearAI';
const { ccclass, property } = _decorator;

@ccclass('OrbitingAxe')
export class OrbitingAxe extends Component {
    @property
    public rotationSpeed: number = 360;

    @property
    public damage: number = 1;

    private _currentAngle: number = 0;

    onEnable() {
        let collider = this.getComponentInChildren(Collider);
        if (collider) {
            collider.on('onTriggerEnter', this.onAxeHit, this);
        }
    }

    onDisable() {
        let collider = this.getComponentInChildren(Collider);
        if (collider) {
            collider.off('onTriggerEnter', this.onAxeHit, this);
        }
    }

    update(dt: number) {
        this._currentAngle += this.rotationSpeed * dt;
        this.node.setRotationFromEuler(0, this._currentAngle, 0);
    }

    private onAxeHit(event: ITriggerEvent) {
        let hitNode = event.otherCollider.node;

        let resourceNode = hitNode.getComponent(ResourceNode);
        if (resourceNode) {
            resourceNode.takeDamage(this.damage);
        }

        let bearAI = hitNode.getComponent(BearAI);
        if (bearAI) {
            bearAI.takeHit(this.node.worldPosition);
        }
    }
}
