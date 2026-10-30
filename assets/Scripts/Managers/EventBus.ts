import { EventTarget } from 'cc';

export const EventBus = new EventTarget();

export enum GameEvents {
    JOYSTICK_MOVE = 'JOYSTICK_MOVE',
    RESOURCE_COLLECTED = 'RESOURCE_COLLECTED',
    RESOURCE_SPENT = 'RESOURCE_SPENT',
    GAME_OVER = 'GAME_OVER',
    OPEN_CTA = 'OPEN_CTA'
}
