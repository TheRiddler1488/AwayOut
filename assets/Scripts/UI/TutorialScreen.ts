import { _decorator, Component, Node, EventTouch, tween, Vec3, Tween } from 'cc';
import { EventBus } from '../Managers/EventBus';
const { ccclass, property } = _decorator;

@ccclass('TutorialScreen')
export class TutorialScreen extends Component {
    @property(Node)
    public handIcon: Node = null;

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    onEnable() {
        if (this.handIcon) {
            this.handIcon.setScale(new Vec3(1, 1, 1));

            tween(this.handIcon)
                .to(0.3, { scale: new Vec3(0.8, 0.8, 1) }, { easing: 'quadInOut' })
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'quadInOut' })
                .delay(0.2)
                .union()
                .repeatForever()
                .start();
        }
    }

    onDisable() {
        if (this.handIcon) {
            Tween.stopAllByTarget(this.handIcon);
        }
    }

    private onTouchStart(event: EventTouch) {
        EventBus.emit('START_GAME');

        this.node.active = false;
    }
}
