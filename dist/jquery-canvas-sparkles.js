/*!
 * jquery-canvas-sparkles - v1.1.0 - 2022-10-25
 *
 * https://github.com/simeydotme/jQuery-canvas-sparkles
 * Copyright (c) 2022 Simon Goellner;
 *
 */

(function($) {

    "use strict";

    $.fn.sparkle = function(options) {

        return this.each(function(k, v) {

            var $this = $(v);

            var settings = $.extend({

                color: "#FFFFFF",
                count: 30,
                overlap: 0,
                speed: 1,
                minSize: 4,
                maxSize: 7,
                direction: "both"

            }, options);

            // initiate a new Sparkle method and bind it to "sparkle" so we
            // can set up events to it.
            var sparkle = new Sparkle($this, settings);

            // bind mouseover/focus/mouseout/blur events to the element
            // with a namespace for easy unbinding.
            $this.on({
                "mouseover.sparkle focus.sparkle": function() {
                    $this.trigger("start.sparkle");
                },
                "mouseout.sparkle blur.sparkle": function() {
                    $this.trigger("stop.sparkle");
                },
                "start.sparkle": function() {
                    sparkle.start($this);
                },
                "stop.sparkle": function() {
                    sparkle.stop();
                },
                "resize.sparkle": function() {
                    sparkle.resize($this);
                    sparkle.setParticles();
                }
            });

        });

    };

    // Constructor method for sparkles,
    // we call init on the class and all other
    // methods on the the Sparkle class are prototyped
    function Sparkle($parent, options) {

        this.options = options;
        this.init($parent);

    }

    Sparkle.prototype = {

        "init": function($parent) {

            var relativeOverlap = 0 - parseInt(this.options.overlap, 10);
            var cssOpts = {
                position: "absolute",
                top: relativeOverlap.toString() + "px",
                left: relativeOverlap.toString() + "px",
                "pointer-events": "none"

            };

            // we need to give the element position if it doesn't
            // already have it, so that we can put the canvas right
            // over the top.
            if ($parent.css("position") === "static") {
                $parent.css("position", "relative");
            }

            // set up the canvas element as a document fragment
            // and give it a class and some css amd append it
            // to our parent element.
            this.$canvas = 
                $("<canvas>")
                    .addClass("sparkle-canvas")
                    .css( cssOpts )
                    .hide();

            // check if the parent has a z-index, if it does
            // then make the canvas 1 place higher than it!
            if ($parent.css("z-index") !== "auto") {
                var zdex = parseInt($parent.css("z-index"),10);
                this.$canvas.css("z-index", zdex+1);
            }

            // check if the DOM element is a singleton, ie it
            // doesnt have a closing tag... we can't put the canvas
            // inside an <img> for example.
            var singletons = "IMG|BR|HR|INPUT";
            var regexp = "\\b"+ $parent[0].nodeName +"\\b";
            this.isSingleton = new RegExp(regexp).test(singletons);

            if( this.isSingleton ) {
                this.$canvas.insertAfter( $parent );
            } else {
                this.$canvas.appendTo( $parent );
            }

            // create our canvas context and save it for
            // future use with this.canvas
            this.canvas = this.$canvas[0];
            this.context = this.canvas.getContext("2d");

            // create our sparkle sprite using the datauri
            // supplied at end of prototype
            this.sprite = new Image();
            this.sprite.src = this.datauri;
            this.spriteCoords = [0, 6, 13, 20];

            // set the canvas width and height using the parent
            // width and height set in the options
            this.canvas.width = $parent.outerWidth()*1.2;
            this.canvas.height = $parent.outerHeight()*1.2;

            this.setParticles();

            this.anim = null;
            this.fade = false;

        },

        "randomParticleSize": function() {

            return Math.floor(Math.random()*(this.options.maxSize-this.options.minSize+1)+this.options.minSize);

        },

        "randomHexColor": function() {

            return '#' + ('000000' + Math.floor(Math.random() * 16777215).toString(16)).slice(-6);

        },

        "setParticles": function() {

            // store our particles into an object for future use
            this.particles = this.createSparkles(this.canvas.width, this.canvas.height);

        },

        "createSparkles": function(w, h) {

            // temporarily store our created particles
            var tempicles = [];

            // loop through and add a new particles
            // on each loop for the count provided
            for (var i = 0; i < this.options.count; i++) {

                var color;

                if (this.options.color === "rainbow") {

                    // if we chose rainbow, give us much random so color very blergh
                    // http://www.paulirish.com/2009/random-hex-color-code-snippets/
                    color = this.randomHexColor();

                } else if ($.type(this.options.color) === "array") {

                    // if we supplied an array, choose a random color from array.
                    color = this.options.color[Math.floor(Math.random() * this.options.color.length)];

                } else {

                    color = this.options.color;

                }

                var yDelta = Math.floor(Math.random() * 1000) - 500;

                if( this.options.direction === "down" ) {
                    yDelta = Math.floor(Math.random() * 500) - 550;
                } else if ( this.options.direction === "up" ) {
                    yDelta = Math.floor(Math.random() * 500) + 50;
                }

                // create a particle with random position,
                // random sprite start point, delta, size and a defined color.
                tempicles[i] = {
                    position: {
                        x: Math.floor(Math.random() * w),
                        y: Math.floor(Math.random() * h)
                    },
                    style: this.spriteCoords[Math.floor(Math.random() * this.spriteCoords.length)],
                    delta: {
                        x: Math.floor(Math.random() * 1000) - 500,
                        y: yDelta
                    },
                    size: this.randomParticleSize(),
                    color: color
                };

            }

            return tempicles;

        },

        "draw": function() {

            // draw is where we draw our particles to the stage.
            // first we clear the entire context for updating.
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // for every particle
            for (var i = 0; i < this.particles.length; i++) {

                // save the context so we can restore teh default settings.
                this.context.save();
                this.context.globalAlpha = this.particles[i].opacity;
                this.context.drawImage(this.sprite, this.particles[i].style, 0, 7, 7, this.particles[i].position.x, this.particles[i].position.y, this.particles[i].size, this.particles[i].size);

                // if we set a color we want to tint the sprite with it
                if (this.options.color) {

                    this.context.globalCompositeOperation = "source-atop";
                    this.context.globalAlpha = 0.6;
                    this.context.fillStyle = this.particles[i].color;
                    this.context.fillRect(this.particles[i].position.x, this.particles[i].position.y, 7, 7);

                }

                this.context.restore();

            }

        },

        "update": function() {

            // update is our particle alteration and animation frame
            // render loop, calling draw on each update.
            var _this = this;

            this.anim = window.requestAnimationFrame(function(time) {

                // store a floored version of the time passed
                var flatTime = Math.floor(time);

                for (var i = 0; i < _this.particles.length; i++) {

                    var p = _this.particles[i];
                    var resizeParticle = false;

                    // randomly move particles in the x/y direction
                    // we weight x heavier than y allowing some random
                    // decelleration giving an ethereal floating feeling
                    var randX = (Math.random() > Math.random() * 2);
                    var randY = (Math.random() < Math.random() * 5);

                    // arbitrary position change/speed based on what felt good.
                    if (randX) {
                        p.position.x += ((p.delta.x * _this.options.speed) / 1500);
                    }

                    // arbitrary position change/speed based on what felt good.
                    if (randY) {
                        p.position.y -= ((p.delta.y * _this.options.speed) / 800);
                    }

                    // if particle fell off of canvas, then position it
                    // back at the opposite side... minus 7 pixels which is the
                    // largest size a particle can be.
                    if (p.position.x > _this.canvas.width) {
                        p.position.x = -(_this.options.maxSize);
                        resizeParticle = true;
                    } else if (p.position.x < -(_this.options.maxSize)) {
                        p.position.x = _this.canvas.width;
                        resizeParticle = true;
                    }

                    // if it fell off top or bottom, give it a random x position
                    if (p.position.y > _this.canvas.height) {
                        p.position.y = -(_this.options.maxSize);
                        p.position.x = Math.floor(Math.random() * _this.canvas.width);
                        resizeParticle = true;
                    } else if (p.position.y < -(_this.options.maxSize)) {
                        p.position.y = _this.canvas.height;
                        p.position.x = Math.floor(Math.random() * _this.canvas.width);
                        resizeParticle = true;
                    }

                    // if the particle left the canvas, let's resize it
                    if ( resizeParticle ) {
                        p.size = _this.randomParticleSize();
                        p.opacity = 0.4;
                    }

                    // if we're trying to fade out fast because
                    // of a _out_ event, increase opacity delta
                    if (_this.fade) {
                        p.opacity -= 0.035;
                    } else {
                        p.opacity -= 0.005;
                    }

                    // if the opacity went below 0, then
                    // set it back to 1.2 (this gives slightly longer brightness)
                    if (p.opacity <= 0.15) {
                        p.opacity = (_this.fade) ? 0 : 1.2;
                    }

                    // basically we want to randomly change the sparkles
                    // sprite position, this arbitrary number _felt_ right.
                    if (flatTime % Math.floor((Math.random() * 7)+1) === 0) {
                        p.style = _this.spriteCoords[Math.floor(Math.random() * _this.spriteCoords.length)];
                    }

                }

                // draw all the particles.
                _this.draw(time);

                // only _stop_ the animation after we've finished
                // fading out and we also hide the canvas.
                if (_this.fade) {
                    _this.fadeCount -= 1;
                    if (_this.fadeCount < 0) {
                        window.cancelAnimationFrame(_this.anim);
                        _this.$canvas.hide();
                    } else {
                        _this.update();
                    }
                } else {
                    _this.update();
                }

            });

        },

        "resize": function($parent) {

            // We set the width/height of the canvas upon mouseover 
            // because of document-load issues with fonts and images and 
            // other things changing dimentions of elements.
            this.canvas.width = $parent.outerWidth() + (this.options.overlap * 2);
            this.canvas.height = $parent.outerHeight() + (this.options.overlap * 2);

            // also if the base element is a singleton then we re-position the
            // canvas. we don't want the canvas to be in the wrong position if
            // something has moved.
            if( this.isSingleton ) {
                this.$canvas.css({
                    top: $parent.position().top - this.options.overlap,
                    left: $parent.position().left - this.options.overlap
                });
            }

        },

        "start": function($parent) {

            this.resize($parent);

            // we hide/show the canvas element on hover
            // just to make sure it has it's garbage collected
            this.$canvas.show();

            // make sure the animation frame was cancelled, or we
            // get multiple update/draw loops happening (BAD) .. this
            // can happen because we let the animation loop continue
            // while it fades out.
            window.cancelAnimationFrame(this.anim);

            // randomize the opacity every time we over the animation
            // this stops our particles all being at same opacity
            // after the fadeout happens.
            for (var i = 0; i < this.options.count; i++) {
                this.particles[i].opacity = Math.random();
            }

            // run our update loop.
            this.fade = false;
            this.update();

        },

        "stop": function() {

            // here we just tell the update loop that
            // we want to fade out, and that we want to
            // take 100 frames to fade out
            this.fade = true;
            this.fadeCount = 100;

        },

        // datauri is our sparkle sprite. Don't touch this.
        // Modded for TLP.... STAR!
        "datauri": "data:image/png;base64,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"

    };

}(jQuery));
