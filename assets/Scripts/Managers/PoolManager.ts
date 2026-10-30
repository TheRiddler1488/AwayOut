import { _decorator, Component, Prefab, NodePool, Node, instantiate, Vec3, Collider } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PoolManager')
export class PoolManager extends Component {
    public static Instance: PoolManager;

    @property(Prefab)
    public logPrefab: Prefab = null;

    @property(Prefab)
    public cashPrefab: Prefab = null;

    @property(Prefab)
    public meatPrefab: Prefab = null;

    private _pools: Map<string, NodePool> = new Map();
    private _prefabs: Map<string, Prefab> = new Map();

    onLoad() {
        if (!PoolManager.Instance) {
            PoolManager.Instance = this;
        } else {
            this.destroy();
            return;
        }

        this._prefabs.set('log', this.logPrefab);
        this._prefabs.set('meat', this.meatPrefab);
        this._prefabs.set('cash', this.cashPrefab);

        this._pools.set('log', new NodePool());
        this._pools.set('meat', new NodePool());
        this._pools.set('cash', new NodePool());

        this.preAllocate('log', 30);
        this.preAllocate('meat', 15);
        this.preAllocate('cash', 20);
    }

    private preAllocate(type: string, count: number) {
        const pool = this._pools.get(type);
        const prefab = this._prefabs.get(type);

        if (pool && prefab) {
            for (let i = 0; i < count; i++) {
                const node = instantiate(prefab);

                if (type === 'log') node.name = 'DroppedLog';
                else if (type === 'meat') node.name = 'DroppedMeat';
                else if (type === 'cash') node.name = 'DroppedCash';
                pool.put(node);
            }
        }
    }

    public spawnResource(type: string, position: Vec3): Node | null {
        const pool = this._pools.get(type);
        if (!pool) return null;

        let node: Node;
        if (pool.size() > 0) {
            node = pool.get();
        } else {
            node = instantiate(this._prefabs.get(type));
            if (type === 'log') node.name = 'DroppedLog';
            else if (type === 'meat') node.name = 'DroppedMeat';
            else if (type === 'cash') node.name = 'DroppedCash';
        }

        node.setPosition(position);

        node.setScale(Vec3.ONE);

        const collider = node.getComponent(Collider);
        if (collider) {
            collider.enabled = true;
        }

        node.setParent(this.node);
        node.active = true;

        return node;
    }

    public returnResource(node: Node) {
        let type = 'cash';
        if (node.name === 'DroppedLog') type = 'log';
        else if (node.name === 'DroppedMeat') type = 'meat';

        const pool = this._pools.get(type);

        if (pool) {
            node.active = false;
            node.removeFromParent();
            pool.put(node);
        } else {
            node.destroy();
        }
    }
}
