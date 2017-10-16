import Phaser from 'phaser';

import FireBehaviour from './FireBehaviour';
import LaserBulletWeapon from '../../weapons/LaserBulletWeapon';
import SmallRedBullet from '../../weapons/SmallRedBullet';

const BULLET_ANGLE = 0.33;
const BULLET_DISTANCE = 100;

export default class extends FireBehaviour {
  constructor(game, owner) {
    super(game, owner);
    this.weapon1 = new LaserBulletWeapon(game, owner, 30, SmallRedBullet);
    this.weapon2 = new LaserBulletWeapon(game, owner, 30, SmallRedBullet);
    this.weapon3 = new LaserBulletWeapon(game, owner, 30, SmallRedBullet);
  }

  update() {
    if (this.key_fire_1.isDown || this.key_fire_2.isDown) {
      const x1 = this.owner.body.x + 
        (Math.cos(this.owner.rotation + BULLET_ANGLE) * BULLET_DISTANCE);
      const y1 = this.owner.body.y +
        (Math.sin(this.owner.rotation + BULLET_ANGLE) * BULLET_DISTANCE);
      const x3 = this.owner.body.x +
        (Math.cos(this.owner.rotation - BULLET_ANGLE) * BULLET_DISTANCE);
      const y3 = this.owner.body.y +
        (Math.sin(this.owner.rotation - BULLET_ANGLE) * BULLET_DISTANCE);

      this.weapon1.fire(null, x1, y1);
      this.weapon2.fire();
      this.weapon3.fire(null, x3, y3);
    }

    // @TODO: Need to make this more performant.
    for (let bulletsGroup of [this.weapon1.bullets,
                              this.weapon2.bullets,
                              this.weapon3.bullets]) {
      this.game.physics.arcade.overlap(this.game.enemiesGroup,
                                       bulletsGroup,
                                       this.collisionHandler,
                                       null,
                                       { owner: this.owner, damageEnemy: this.damageEnemy });
      }
  }
}
