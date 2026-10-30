import { _decorator, Component, Collider, ITriggerEvent, tween, Vec3, Node, Tween } from 'cc';
import { UnitStack } from '../GamePlay/UnitStack';
import { EventBus } from './EventBus';
const { ccclass, property } = _decorator;

@ccclass('Warehouse')
export class Warehouse extends Component {
    @property
    public acceptedResourceType: string = 'log';

    @property(Node)
    public gridCenter: Node = null;

    @property public gridCols: number = 3;
    @property public gridRows: number = 3;
    @property public spacingXY: number = 1.0;
    @property public itemHeight: number = 0.5;

    @property
    public storedItemScale: number = 1.0;

    public visuallyStoredItems: Node[] = [];

    private _activeStacks: UnitStack[] = [];
    private _unloadTimer: number = 0;
    private _calcPos: Vec3 = new Vec3();

    onEnable() {
        let collider = this.getComponent(Collider);
        if (collider) {
            collider.on('onTriggerEnter', this.onEnterZone, this);
            collider.on('onTriggerExit', this.onExitZone, this);
        }
    }

    private onEnterZone(event: ITriggerEvent) {
        let otherNode = event.otherCollider.node;
        if (otherNode.name === 'Seller') return;

        let stack = otherNode.getComponent(UnitStack);
        if (stack && this._activeStacks.indexOf(stack) === -1) {
            this._activeStacks.push(stack);
        }
    }

    private onExitZone(event: ITriggerEvent) {
        let stack = event.otherCollider.node.getComponent(UnitStack);
        if (stack) {
            let index = this._activeStacks.indexOf(stack);
            if (index > -1) this._activeStacks.splice(index, 1);
        }
    }

    update(dt: number) {
        if (this._activeStacks.length === 0) return;

        this._unloadTimer += dt;
        if (this._unloadTimer >= 0.1) {
            this._unloadTimer = 0;
            for (let i = 0; i < this._activeStacks.length; i++) {
                this.unloadOneItem(this._activeStacks[i]);
            }
        }
    }

    private unloadOneItem(stack: UnitStack) {
        let item = stack.popAnyItem(this.acceptedResourceType);
        if (!item) return;

        let isCorrectType = (this.acceptedResourceType === 'log' && item.name === 'DroppedLog') || (this.acceptedResourceType === 'meat' && item.name === 'DroppedMeat');

        if (!isCorrectType) {
            stack.pushItem(item, false);
            return;
        }

        item.setParent(this.gridCenter);
        this.visuallyStoredItems.push(item);

        let index = this.visuallyStoredItems.length - 1;
        let itemsPerLayer = this.gridCols * this.gridRows;
        let layer = Math.floor(index / itemsPerLayer);
        let remainder = index % itemsPerLayer;
        let col = remainder % this.gridCols;
        let row = Math.floor(remainder / this.gridCols);

        let xOffset = (col - (this.gridCols - 1) / 2) * this.spacingXY;
        let zOffset = (row - (this.gridRows - 1) / 2) * this.spacingXY;
        let yOffset = layer * this.itemHeight;

        EventBus.emit('PLAY_SFX', 'drop');

        this._calcPos.set(xOffset, yOffset, zOffset);

        Tween.stopAllByTarget(item);
        tween(item)
            .to(0.3, {
                position: this._calcPos,
                scale: new Vec3(this.storedItemScale, this.storedItemScale, this.storedItemScale)
            })
            .start();
    }

    public takeItemForSale(): Node | null {
        if (this.visuallyStoredItems.length > 0) {
            return this.visuallyStoredItems.pop();
        }
        return null;
    }

    public getStoredCount(): number {
        return this.visuallyStoredItems.length;
    }
}
