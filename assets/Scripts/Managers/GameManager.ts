import { _decorator, Component, Node } from 'cc';
import { EventBus, GameEvents } from './EventBus';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node)
    public ctaScreen: Node = null;

    @property
    public timeToCTA: number = 90.0;

    private _timer: number = 0;
    private _isCtaShown: boolean = false;

    onEnable() {
        EventBus.on(GameEvents.OPEN_CTA, this.showCTA, this);
    }

    onDisable() {
        EventBus.off(GameEvents.OPEN_CTA, this.showCTA, this);
    }

    update(dt: number) {
        if (!this._isCtaShown) {
            this._timer += dt;
            if (this._timer >= this.timeToCTA) {
                this.showCTA();
            }
        }
    }

    private showCTA() {
        if (this._isCtaShown) return;
        this._isCtaShown = true;

        if (this.ctaScreen) {
            this.ctaScreen.active = true;
        }
    }
}
