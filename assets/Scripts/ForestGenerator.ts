import { _decorator, Component, Prefab, instantiate, Vec3, Node, CCBoolean } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('ForestGenerator')
@executeInEditMode(true)
export class ForestGenerator extends Component {
    @property({ type: Prefab, tooltip: 'Префаб дерева (ResourceNode)' })
    public treePrefab: Prefab = null;

    @property({ tooltip: 'Количество деревьев' })
    public treeCount: number = 50;

    @property({ tooltip: 'Размер зоны по оси X' })
    public areaWidth: number = 40;

    @property({ tooltip: 'Размер зоны по оси Z' })
    public areaLength: number = 40;

    @property({
        type: Node,
        tooltip: 'Нода базы/магазина, на которой нельзя сажать'
    })
    public baseToAvoid: Node = null;

    @property({ tooltip: 'Радиус пустой зоны вокруг базы' })
    public avoidRadius: number = 8.0;

    @property({
        type: CCBoolean,
        tooltip: 'Поставь галочку, чтобы СОЗДАТЬ лес'
    })
    get generateNow() {
        return false;
    }
    set generateNow(val: boolean) {
        if (val) this.generateForest();
    }

    @property({
        type: CCBoolean,
        tooltip: 'Поставь галочку, чтобы УДАЛИТЬ все деревья'
    })
    get clearNow() {
        return false;
    }
    set clearNow(val: boolean) {
        if (val) this.clearForest();
    }

    private generateForest() {
        if (!this.treePrefab) {
            console.warn('ForestGenerator: Добавь префаб дерева!');
            return;
        }

        this.clearForest();

        let basePos = this.baseToAvoid ? this.baseToAvoid.worldPosition : null;
        let spawned = 0;
        let attempts = 0;
        let maxAttempts = this.treeCount * 10;

        let originalScale = new Vec3();

        while (spawned < this.treeCount && attempts < maxAttempts) {
            attempts++;

            let randX = (Math.random() - 0.5) * this.areaWidth;
            let randZ = (Math.random() - 0.5) * this.areaLength;
            let spawnPos = new Vec3(randX, 0, randZ);

            Vec3.add(spawnPos, spawnPos, this.node.worldPosition);

            if (basePos && Vec3.distance(spawnPos, basePos) < this.avoidRadius) {
                continue;
            }

            let tree = instantiate(this.treePrefab);

            tree.getScale(originalScale);

            tree.setRotationFromEuler(0, Math.random() * 360, 0);

            let scaleMultiplier = 0.8 + Math.random() * 0.4;

            tree.setScale(new Vec3(originalScale.x * scaleMultiplier, originalScale.y * scaleMultiplier, originalScale.z * scaleMultiplier));

            tree.setPosition(spawnPos);
            tree.setParent(this.node);

            spawned++;
        }

        console.log(`ForestGenerator: Успешно посажено ${spawned} деревьев.`);
    }

    private clearForest() {
        let children = [...this.node.children];
        for (let i = 0; i < children.length; i++) {
            children[i].destroy();
        }
        console.log('ForestGenerator: Лес вырублен.');
    }
}
