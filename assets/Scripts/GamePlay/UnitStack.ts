import { _decorator, Component, Node, Collider, ITriggerEvent, Vec3, tween, Tween } from 'cc';
import { EventBus } from '../Managers/EventBus';
const { ccclass, property } = _decorator;

@ccclass('UnitStack')
export class UnitStack extends Component {
    @property(Node)
    public logContainer: Node = null;

    @property(Node)
    public meatContainer: Node = null;

    @property
    public maxCapacity: number = 10;

    @property
    public itemHeight: number = 0.5;

    public collectedLogs: Node[] = [];
    public collectedMeat: Node[] = [];

    onEnable() {
        let collider = this.getComponent(Collider);
        if (collider) {
            collider.on('onTriggerEnter', this.onTriggerEnter, this);
            collider.on('onTriggerStay', this.onTriggerEnter, this);
        }
    }

    onDisable() {
        let collider = this.getComponent(Collider);
        if (collider) {
            collider.off('onTriggerEnter', this.onTriggerEnter, this);
            collider.off('onTriggerStay', this.onTriggerEnter, this);
        }
    }

    private onTriggerEnter(event: ITriggerEvent) {
        if (this.isFull()) return;
        let otherNode = event.otherCollider.node;

        if (otherNode.name === 'DroppedLog' || otherNode.name === 'DroppedMeat') {
            let col = otherNode.getComponent(Collider);
            if (col && !col.enabled) return;

            this.pushItem(otherNode, true);
        }
    }

    public pushItem(item: Node, animate: boolean = true) {
        if (this.isFull()) return;

        if (this.collectedLogs.indexOf(item) !== -1 || this.collectedMeat.indexOf(item) !== -1) {
            return;
        }

        if (!(item as any).origScale) {
            let currentScale = item.scale;
            (item as any).origScale = new Vec3(currentScale.x, currentScale.y, currentScale.z);
        }

        let col = item.getComponent(Collider);
        if (col) col.enabled = false;

        let isLog = item.name === 'DroppedLog';
        let targetArray = isLog ? this.collectedLogs : this.collectedMeat;
        let targetContainer = isLog ? this.logContainer : this.meatContainer;

        item.setParent(targetContainer, true);
        targetArray.push(item);

        this.realignStacks(animate ? 0.2 : 0);
        EventBus.emit('PLAY_SFX', 'pickup');
    }

    public extractSpecificItem(targetName: string): Node | null {
        let isLog = targetName === 'DroppedLog';
        let targetArray = isLog ? this.collectedLogs : this.collectedMeat;

        while (targetArray.length > 0) {
            let item = targetArray.pop();
            if (item && item.isValid) {
                this.realignStacks(0.15);
                return item;
            }
        }
        return null;
    }

    public popAnyItem(preferredType?: string): Node | null {
        let result: Node | null = null;

        if (preferredType === 'log' && this.collectedLogs.length > 0) {
            result = this.extractSpecificItem('DroppedLog');
        } else if (preferredType === 'meat' && this.collectedMeat.length > 0) {
            result = this.extractSpecificItem('DroppedMeat');
        } else if (this.collectedLogs.length > 0) {
            result = this.extractSpecificItem('DroppedLog');
        } else if (this.collectedMeat.length > 0) {
            result = this.extractSpecificItem('DroppedMeat');
        }

        return result;
    }

    public isFull(): boolean {
        this.cleanArrays();
        return this.collectedLogs.length + this.collectedMeat.length >= this.maxCapacity;
    }

    private cleanArrays() {
        this.collectedLogs = this.collectedLogs.filter((item) => item && item.isValid && item.parent === this.logContainer);
        this.collectedMeat = this.collectedMeat.filter((item) => item && item.isValid && item.parent === this.meatContainer);
    }

    private realignStacks(duration: number) {
        this.cleanArrays();

        for (let i = 0; i < this.collectedLogs.length; i++) {
            let item = this.collectedLogs[i];
            Tween.stopAllByTarget(item);

            let targetY = i * this.itemHeight;

            if (duration > 0) {
                tween(item)
                    .to(duration, {
                        position: new Vec3(0, targetY, 0),
                        scale: new Vec3(0.5, 0.5, 0.5),
                        eulerAngles: Vec3.ZERO
                    })
                    .start();
            } else {
                item.setPosition(new Vec3(0, targetY, 0));
                item.setScale(new Vec3(0.5, 0.5, 0.5));
                item.setRotationFromEuler(Vec3.ZERO);
            }
        }

        for (let i = 0; i < this.collectedMeat.length; i++) {
            let item = this.collectedMeat[i];
            Tween.stopAllByTarget(item);

            let targetY = i * this.itemHeight;

            if (duration > 0) {
                tween(item)
                    .to(duration, {
                        position: new Vec3(0, targetY, 0),
                        scale: new Vec3(0.5, 0.5, 0.5),
                        eulerAngles: Vec3.ZERO
                    })
                    .start();
            } else {
                item.setPosition(new Vec3(0, targetY, 0));
                item.setScale(new Vec3(0.5, 0.5, 0.5));
                item.setRotationFromEuler(Vec3.ZERO);
            }
        }
    }
}
