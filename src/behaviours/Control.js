 import Phaser from 'phaser';

import Behaviour from './Behaviour';

const SIDEWAYS_FRICTION = 0.987;
const IMMOBILISE_LERP = 0.007;
const STOP_OFFSET = 1.5;
const ROTATION_THRUST_FRICTION = 0.45;

export default class extends Behaviour {

  constructor(game, owner) {
    super(game, owner);

    this.turnLeftAnimation = owner.animations.add('turn_left', [0, 11, 12, 13, 14, 15, 16, 17, 18, 19], 25, false);
    this.turnRightAnimation = owner.animations.add('turn_right', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 25, false);

    this.cursors = game.input.keyboard.createCursorKeys();
    this.initKeyboard(this.game, this.turnLeftAnimation, this.turnRightAnimation);

    this.thrust = new Phaser.Sprite(game, 0, 0, 'thrust');
    this.thrust.x = -owner.offsetX - this.thrust.width;
    this.thrust.y = -owner.offsetY + 8;
    this.thrustAnim = this.thrust.animations.add('thrusting', null, 10, true);
    this.thrustAnim.play();
    owner.addChild(this.thrust);

    this.previousLeftIsDown = false;
    this.previousRightIsDown = false;
    this.doublePressKey = null;
  }

  initKeyboard(game, turnLeftAnimation, turnRightAnimation) {
    this.key_left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    this.key_right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    this.key_thrust = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    this.key_reverse = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);

    this.key_left.onHoldContext = this;
    this.key_right.onHoldContext = this;
    this.key_left.onHoldCallback = this.animateLeft;
    this.key_right.onHoldCallback = this.animateRight;
    this.key_left.onUp.add(this.resetAnimation, {animation: turnLeftAnimation,
                                                 other: turnRightAnimation,
                                                 control: this});
    this.key_right.onUp.add(this.resetAnimation, {animation: turnRightAnimation,
                                                  other: turnLeftAnimation,
                                                  control: this});
  }

  animateLeft() {
    this.animate(this.turnLeftAnimation, this.turnRightAnimation);
  }

  animateRight() {
    this.animate(this.turnRightAnimation, this.turnLeftAnimation);
  }

  animate(animation, other) {
    if ((this.doublePressKey === this.key_left && animation.name === 'turn_left') ||
        (this.doublePressKey === this.key_right && animation.name === 'turn_right')) {
      return;
    }

      if (!other.isReversed || !other.isPlaying ) {
        if (animation.isReversed || 
            (!animation.isPlaying && !animation.isFinished)) {
          if (animation.isReversed) {
            animation.reverse();
          }
          animation.play();
        }
      }
  }

  resetAnimation() {
    if ((this.control.doublePressKey === this.control.key_left && this.animation.name === 'turn_left') ||
        (this.control.doublePressKey === this.control.key_right && this.animation.name === 'turn_right')) {
      return;
    }

    if (!this.other.isReversed || !this.other.isPlaying) {
      this.animation.reverse();
      if (this.animation.isFinished) {
        this.animation.play();
      }
    }
  }

  doublePress() {
    if (this.key_left.isDown && this.previousLeftIsDown && this.key_right.isDown) {
      return this.key_right;
    } else if (this.key_right.isDown && this.previousRightIsDown && this.key_left.isDown) {
      return this.key_left;
    } else {
      return null;
    }
  }

  update() {
    this.doublePressKey = this.doublePress();
    let leftIsDown = this.key_left.isDown;
    let rightIsDown = this.key_right.isDown;

    if (this.doublePressKey === this.key_right) {
      rightIsDown = false;
    } else if (this.doublePressKey === this.key_left) {
      leftIsDown = false;
    }

    // Move
    if (leftIsDown || rightIsDown) {
      let rotationSpeed = this.owner.movement.rotationSpeed;
      if (this.key_thrust.isDown || this.key_reverse.isDown) {
        rotationSpeed *= ROTATION_THRUST_FRICTION;
      }
      if (leftIsDown) {
        this.owner.body.angularVelocity = -rotationSpeed;
      } else {
        this.owner.body.angularVelocity = rotationSpeed;
      }
    } else {
      this.owner.body.angularVelocity = 0;
    }

    if (this.key_thrust.isDown) {
      const magnitude = this.owner.body.velocity.getMagnitude();
      this.game.physics.arcade.accelerationFromRotation(this.owner.rotation,
                                                        this.owner.movement.acceleration,
                                                        this.owner.body.acceleration);
      this.owner.body.velocity.setMagnitude(Math.min(this.owner.movement.maxVelocity,
                                                     magnitude));

      this.thrust.visible = false;
    } else if (this.key_reverse.isDown) {
      this.game.physics.arcade.accelerationFromRotation(this.owner.rotation,
                                                        -this.owner.movement.acceleration,
                                                        this.owner.body.acceleration);
      this.owner.body.velocity.setMagnitude(Math.min(this.owner.movement.maxVelocity,
                                                     this.owner.body.velocity.getMagnitude()));
    } else {
      this.thrust.visible = false;
      this.owner.body.acceleration.set(0);

      // Immobilise
      if (Math.abs(this.owner.body.velocity.x) < STOP_OFFSET &&
          Math.abs(this.owner.body.velocity.y) < STOP_OFFSET) {
        this.owner.body.velocity.set(0, 0);
      } else if (this.owner.body.velocity.x !== 0 || this.owner.body.velocity.y !== 0) {
        this.owner.body.velocity.set(this.game.math.linear(this.owner.body.velocity.x,
                                                           0, IMMOBILISE_LERP),
                                     this.game.math.linear(this.owner.body.velocity.y,
                                                           0, IMMOBILISE_LERP));
      }
    }

    this.previousLeftIsDown = leftIsDown;
    this.previousRightIsDown = rightIsDown;
  }
}
