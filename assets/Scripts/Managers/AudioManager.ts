import { _decorator, Component, AudioSource, AudioClip, Vec3, Node, sys } from 'cc';
import { EventBus } from '../Managers/EventBus';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    @property(AudioSource)
    public bgmSource: AudioSource = null;

    @property(AudioSource)
    public sfxSource: AudioSource = null;

    @property(Node)
    public playerNode: Node = null;

    @property
    public maxHearingDistance: number = 15.0;

    @property(AudioClip) public chopClip: AudioClip = null;
    @property(AudioClip) public bearHitClip: AudioClip = null;
    @property(AudioClip) public pickupClip: AudioClip = null;
    @property(AudioClip) public dropClip: AudioClip = null;
    @property(AudioClip) public sellClip: AudioClip = null;
    @property(AudioClip) public moneyClip: AudioClip = null;
    @property(AudioClip) public unlockClip: AudioClip = null;

    private _lastPlayTimes: Map<string, number> = new Map();

    onEnable() {
        EventBus.on('START_GAME', this.onStartGame, this);
        EventBus.on('PLAY_SFX', this.onPlaySFX, this);
    }

    onDisable() {
        EventBus.off('START_GAME', this.onStartGame, this);
        EventBus.off('PLAY_SFX', this.onPlaySFX, this);
    }

    private onStartGame() {
        if (this.bgmSource && !this.bgmSource.playing) {
            this.bgmSource.play();
        }
    }

    private onPlaySFX(clipName: string, worldPos?: Vec3) {
        if (!this.sfxSource) return;

        let now = sys.now();

        if (this._lastPlayTimes.has(clipName)) {
            let cooldown = clipName === 'bear' ? 1000 : 150;
            if (now - this._lastPlayTimes.get(clipName) < cooldown) {
                return;
            }
        }

        let clipToPlay: AudioClip = null;
        switch (clipName) {
            case 'chop':
                clipToPlay = this.chopClip;
                break;
            case 'bear':
                clipToPlay = this.bearHitClip;
                break;
            case 'pickup':
                clipToPlay = this.pickupClip;
                break;
            case 'drop':
                clipToPlay = this.dropClip;
                break;
            case 'sell':
                clipToPlay = this.sellClip;
                break;
            case 'money':
                clipToPlay = this.moneyClip;
                break;
            case 'unlock':
                clipToPlay = this.unlockClip;
                break;
        }

        if (!clipToPlay) return;

        this._lastPlayTimes.set(clipName, now);

        let volume = clipName === 'bear' ? 0.3 : 1.0;

        if (worldPos && this.playerNode) {
            let dist = Vec3.distance(worldPos, this.playerNode.worldPosition);
            if (dist > this.maxHearingDistance) {
                return;
            }

            volume *= 1.0 - dist / this.maxHearingDistance;

            if (volume < 0) volume = 0;
        }

        this.sfxSource.playOneShot(clipToPlay, volume);
    }
}
