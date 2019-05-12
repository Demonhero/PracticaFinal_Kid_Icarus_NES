var game = function ()
{
  var Q = window.Q = Quintus({ audioSupporter: ["mp3"] })
    .include("Sprites, Scenes, Input, UI, Touch, TMX, Anim, 2D, Audio")
    .setup({maximize: true})
    .controls()
    .touch()
    .enableSound();

  var SPRITE_PLAYER = 1;
  var SPRITE_BULLET = 2;
  var SPRITE_ENEMY = 3;
  var SPRITE_OBJECT = 4;
  var SPRITE_FLY = 5;


  // PIT

  Q.Sprite.extend("Pit",
  {
    init: function (p)
    {
      this._super(p,
      {
        sprite: "pit_anim",
        sheet: "pit",
        type: SPRITE_PLAYER,
        gravity: 0.50,
        x: 60,
        y: 1346,
        frame: 1,
        alive: true,
        live: 7,
        sort: true,
        direction: "right",
        speed: 80,
        jumpSpeed: -280,
        jumped: false
      });

      this.add("2d, platformerControls, animation");
      this.on("bump.left, bump.right, bump.up", function (collision) { });
      this.on("bump.left, bump.right, bump.up", this, "hit");
      Q.input.on("fire", this, "shoot");
      Q.input.on("S", this, "shootUp");
      this.on("dying", this, "die");
      this.play("stand_right");
    },

    step: function (dt)
    {
      if (this.p.alive)
      {
        // Si se sale de los limites
        if (this.p.x > 257) this.p.x = 1;
        if (this.p.x < 0) this.p.x = 256;
        
        if (this.p.vy == 0 && this.p.vx == 0 && !this.p.ignoreControls)
        {
          this.play("stand_" + this.p.direction);
          this.p.jumped = false;
        }
        else if (this.p.landed > 0 && !this.p.ignoreControls)
        {
          this.p.jumped = false;
          this.play("walk_" + this.p.direction);
            
        }
        else if (!this.p.ignoreControls)
        { 
          this.p.jumped = true;
          this.play("jump_" + this.p.direction);
        }

        if (this.p.jumped) {
            Q.audio.play("Salto.mp3", { loop: false });
        }
      }
    },

    shoot: function ()
    {
      var p = this.p;
      if (p.direction == "right")
      {
        this.play("stand_right");
        this.stage.insert(new Q.Arrow(
        {
          x: p.x,
          y: p.y + p.h / 8,
          vx: 200
        }))
      }
      else
      {
        this.play("stand_left");
        this.stage.insert(new Q.Arrow(
        {
          x: p.x,
          y: p.y + p.h / 8,
          vx: -200
        }))
      }

    },

    shootUp: function ()
    {
      var p = this.p;
      this.play("lookUp");
      this.stage.insert(new Q.ArrowUp(
      {
        x: p.x,
        y: p.y - p.h / 2,
        vy: -200
      }));
    },

    hit: function (collision)
    {
      if (collision.obj.isA("Viperix"))
      {
        this.p.live--;
        if (this.p.direction == "right")
        {
          this.play("damage_right");
        }
        else
        {
          this.play("damage_left");
        }
        if (this.p.live == 0)
        {
          this.p.alive = false;
          this.play("death");
        }
      }
    },
    die: function ()
    {
      this.destroy();
      const player = stage.insert(new Q.Pit());
      stage.add("viewport").follow(player);
      stage.viewport.scale = 2;
    }
  });
  //----------------------------------------------------------------------//

  Q.animations("pit_anim",
  {
    stand_right: { frames: [1], flip: false, loop: true, rate: 1 / 5 },
    stand_left: { frames: [1], flip: "x", loop: true, rate: 1 / 5 },
    walk_right: { frames: [1, 4, 3, 2], rate: 1 / 20, flip: false, loop: true, next: "stand_right" },
    walk_left: { frames: [1, 4, 3, 2], rate: 1 / 20, flip: "x", loop: true, next: "stand_left" },
    jump_right: { frames: [7, 6], flip: false, loop: false, rate: 1 / 5 },
    jump_left: { frames: [7, 6], flip: "x", loop: false, rate: 1 / 5 },
    lookUp: { frames: [8, 9], rate: 1 / 5, flip: false, loop: false },
    death: { frames: [0], flip: false, rate: 1 / 5, loop: false, trigger: "dying" },
    damage_right: { frames: [5, 1, 5, 1], flip: false, rate: 1 / 15, loop: false },
    damage_left: { frames: [5, 1, 5, 1], flip: "x", rate: 1 / 15, loop: false }
  });
  //----------------------------------------------------------------------//

  // ARROW

  Q.MovingSprite.extend("Arrow",
  {
    init: function (p)
    {
      this._super(p,
      {
        sheet: "arrow",
        sprite: "arrow",
        type: SPRITE_BULLET,
        collisionMask: SPRITE_ENEMY,
        sensor: true,
        sort: true,
        gravity: 0
      });

      this.add("2d");
    },

    step: function (dt)
    {
      if (this.p.vx == 0)
      {
        this.destroy();
      }
      if (this.p.x < 0 || this.p.x > 257)
      {
        this.destroy();
      }
    }
  });

  Q.MovingSprite.extend("ArrowUp",
  {
    init: function (p)
    {
      this._super(p,
      {
        sheet: "arrowUp",
        sprite: "arrowUp",
        type: SPRITE_BULLET,
        collisionMask: SPRITE_ENEMY,
        sensor: true,
        sort: true,
        gravity: 0
      });

      this.add("2d");
    },

    step: function (dt)
    {
      if (this.p.vy == 0)
      {
        this.destroy();
      }
      if (this.p.y < 0)
      {
        this.destroy();
      }
    }
  });

  //-------------------------------------------------------------------//

  // VIPERIX

  Q.Sprite.extend("Viperix",
  {
    init: function (p)
    {
      this._super(p,
      {
        sprite: "viperix_anim",
        sheet: "viperix1",
        type: SPRITE_ENEMY,
        collisionMask: SPRITE_BULLET | SPRITE_PLAYER,
        gravity: 0.65,
        frame: 1,
        live: 1,
        exp: 100,
        heart: 1,
        vx: 20,
        hit: 1
      });

      this.add("2d, aiBounce, animation");
      this.on("bump.left, bump.right, bump.top, bump.bottom", this, "hit");
      this.on("hit", this, "killed");
    },
    hit: function (collision)
    {
      if (collision.obj.isA("Pit") && this.p.live <= 0)
      {
        this.destroy();
      }

    },
    killed: function (collision)
    {
      if (collision.obj.isA("Arrow") || collision.obj.isA("ArrowUp"))
      {
        this.p.live--;
        if (this.p.live <= 0)
        {
          this.p.sheet = "corazonMini";
          this.play("viperStop");
          this.p.vx = 0;
        }
      }

    },

    step: function (dt)
    {
      if (this.p.live > 0)
      {
        if (this.p.vx > 0) this.play("viperR");
        if (this.p.vx < 0) this.play("viperL");
      }
    }

  });
  //------------------------------------------------------------------------//

  Q.animations("viperix_anim",
  {
    viperR: { frames: [0, 1], flip: false, loop: true, rate: 1 / 5 },
    viperL: { frames: [0, 1], flip: "x", loop: true, rate: 1 / 5 },
    viperStop: { frames: [0], flip: false, loop: false, rate: 1 / 5 }
  });

  //----------------------------------------------------------------------//

  // MONOCULUS

  Q.Sprite.extend("Monoculus",
  {
    init: function (p)
    {
      this._super(p,
      {
        sprite: "monoculus_anim",
        sheet: "monoculus",
        type: SPRITE_FLY,
        collisionMask: SPRITE_BULLET,
        gravity: 0,
        frame: 1,
        live: 1,
        exp: 300,
        heart: 5,
        vx: 30,
        vy: 10,
        z: 32,
        hit: 1,
        sensor: false
      });

      this.add("2d, aiBounce, animation");
      this.on("bump.left, bump.right, bump.top, bump.bottom", this, "hit");
      this.on("hit", this, "killed");
    },

    hit: function (collision)
    {
      if (collision.obj.isA("Pit") && this.p.live <= 0)
      {
        this.destroy();
      }

    },

    killed: function (collision)
    {
      if (collision.obj.isA("Arrow") || collision.obj.isA("ArrowUp"))
      {
        this.p.live--;
        if (this.p.live <= 0)
        {
          this.p.sheet = "medioCorazon";
          this.play("monoculusStop");
          this.p.vx = 0;
          this.p.vy = 0;
          this.p.sensor = true;
          this.p.collisionMask = SPRITE_PLAYER;
        }
      }

    },

    step: function (dt)
    {
      if (this.p.live > 0)
      {
        this.p.time += 0.01;
        var centroX = 256 / 2;
        var centroY = (this.p.yIni + this.p.yFin) / 2;
        var t = this.p.time;
        scale = 120;
        this.p.x = centroX + scale * Math.cos(t);
        this.p.y = centroY + scale * Math.sin(2 * t) / 2;
        if ((this.p.x > centroX && this.p.y < centroY) || (this.p.x < centroX && this.p.y > centroY))
        {
          this.play("monoculusR");
        }
        else
        {
          this.play("monoculusL");
        }

      }
    }

  });
  //------------------------------------------------------------------------//

  Q.animations("monoculus_anim",
  {
    monoculusR: { frames: [0], flip: false, loop: true, rate: 1 / 10 },
    monoculusL: { frames: [1], flip: false, loop: true, rate: 1 / 10 },
    monoculusStop: { frames: [0], flip: false, loop: false, rate: 1 / 5 }
  });

  //------------------------------------------------------------------------//

  // FUNESTO

  Q.Sprite.extend("Funesto",
  {
    init: function (p)
    {
      this._super(p,
      {
        sprite: "funesto_anim",
        sheet: "funesto",
        type: SPRITE_ENEMY,
        collisionMask: SPRITE_BULLET | SPRITE_PLAYER,
        gravity: 0.65,
        frame: 1,
        live: 10,
        exp: 500,
        heart: 10,
        hit: 2,
        vx: 10,
        running: false
      });

      this.add("2d, aiBounce, animation");
      this.on("bump.left, bump.right, bump.top, bump.bottom", this, "hit");
      this.on("hit", this, "killed");
    },

    hit: function (collision)
    {
      if (collision.obj.isA("Pit") && this.p.live <= 0)
      {
        Q.state.inc("score", 10); // Incremento score
        this.destroy(); // destruye objeto
      }

    },

    killed: function (collision)
    {
      if (collision.obj.isA("Arrow") || collision.obj.isA("ArrowUp"))
      {
        this.p.live--;
        if (this.p.live <= 0)
        {
          this.p.sheet = "corazon";
          this.play("funestoStop");
          this.p.vx = 0;
          this.p.vy = 0;
        }
      }

    },

    step: function (dt)
    {
      if (this.p.live > 0)
      {
        var pit = Q("Pit");
        pit = pit.items[0];
        if (pit.p.y == this.p.y)
        {
          if (pit.p.x - this.p.x > 0) this.p.vx = 60;
          if (pit.p.x - this.p.x < 0) this.p.vx = -60;
          if (this.p.vx > 0 && !this.p.running)
          {
            this.play("funestoRunR");
            this.p.running = true;

          }
          if (this.p.vx < 0 && !this.p.running)
          {
            this.play("funestoRunL");
            this.p.running = true;
          }

        }
        else
        {
          if (this.p.running) this.p.vx = this.p.vx / 6;
          if (this.p.vx > 0) this.play("funestoR");
          if (this.p.vx < 0) this.play("funestoL");
          this.p.running = false;
        }
        if (this.p.xIni > this.p.x || this.p.xFin < this.p.x)
        {
          this.p.vx = -this.p.vx;
          this.p.vy = -this.p.vy;
        }
      }
    }

  });

  //------------------------------------------------------------------------//

  Q.animations("funesto_anim",
  {
    funestoR: { frames: [0], flip: false, loop: true, rate: 1 },
    funestoL: { frames: [0], flip: "x", loop: true, rate: 1 },
    funestoStop: { frames: [0], flip: false, loop: false, rate: 1 },
    funestoRunR: { frames: [1, 2], flip: false, loop: true, rate: 1 / 5 },
    funestoRunL: { frames: [1, 2], flip: "x", loop: true, rate: 1 / 5 }
  });

  //------------------------------------------------------------------------//

  // FUNESTO M

  Q.Sprite.extend("FunestoM",
  {
    init: function (p)
    {
      this._super(p,
      {
        sprite: "funestoM_anim",
        sheet: "funestoM",
        type: SPRITE_FLY,
        collisionMask: SPRITE_BULLET,
        gravity: 0,
        frame: 1,
        live: 2,
        exp: 100,
        heart: 1,
        z: 32,
        hit: 1,
        sensor: false
      });

      this.add("2d, aiBounce, animation");
      this.on("bump.left, bump.right, bump.top, bump.bottom", this, "hit");
      this.on("hit", this, "killed");
    },

    hit: function (collision)
    {
      if (collision.obj.isA("Pit") && this.p.live <= 0)
      {
        this.destroy();
      }

    },

    killed: function (collision)
    {
      if (collision.obj.isA("Arrow") || collision.obj.isA("ArrowUp"))
      {
        this.p.live--;
        if (this.p.live <= 0)
        {
          this.p.sheet = "corazonMini";
          this.play("funestoMStop");
          this.p.vx = 0;
          this.p.vy = 0;
          this.p.sensor = true;
          this.p.collisionMask = SPRITE_PLAYER;
        }
      }

    },

    step: function (dt)
    {
      if (this.p.live > 0)
      {
        this.p.time += 0.01;
        var centroX = 256 / 2;
        var centroY = (this.p.yIni + this.p.yFin) / 2;
        var t = this.p.time;
        scale = 100;
        this.p.x = centroX + scale * Math.sin(2 * t) / 2;
        this.p.y = centroY + scale * Math.cos(t);
        if ((this.p.x > centroX && this.p.y < centroY) || (this.p.x < centroX && this.p.y > centroY))
        {
          this.play("funestoML");
        }
        else
        {
          this.play("funestoMR");
        }

      }
    }

  });
  //------------------------------------------------------------------------//

  Q.animations("funestoM_anim",
  {
    funestoMR: { frames: [0], flip: false, loop: true, rate: 1 / 10 },
    funestoML: { frames: [0], flip: "x", loop: true, rate: 1 / 10 },
    funestoMStop: { frames: [0], flip: false, loop: false, rate: 1 / 5 }
  });

  //------------------------------------------------------------------------//

  // NAPIAS

  Q.Sprite.extend("Napias",
  {
    init: function (p)
    {
      this._super(p,
      {
        sprite: "napias_anim",
        sheet: "napias",
        type: SPRITE_FLY,
        collisionMask: SPRITE_BULLET,
        gravity: 0,
        frame: 1,
        live: 2,
        exp: 0,
        heart: 5,
        vx: 30,
        vy: 10,
        hit: 1,
        sensor: false
      });

      this.add("2d, aiBounce, animation");
      this.on("bump.left, bump.right, bump.top, bump.bottom", this, "hit");
      this.on("hit", this, "killed");
    },

    hit: function (collision)
    {
      if (collision.obj.isA("Pit") && this.p.live <= 0)
      {
        this.destroy();
      }

    },

    killed: function (collision)
    {
      if (collision.obj.isA("Arrow") || collision.obj.isA("ArrowUp"))
      {
        this.p.live--;
        if (this.p.live <= 0)
        {
          this.p.sheet = "corazon";
          this.play("napiasStop");
          this.p.vx = 0;
          this.p.vy = 0;
          this.p.sensor = true;
          this.p.collisionMask = SPRITE_PLAYER;
        }
      }

    },

    step: function (dt)
    {
      if (this.p.live > 0)
      {
        this.p.time += 0.01;
        var centroX = 256 / 2;
        var centroY = (this.p.yIni + this.p.yFin) / 2;
        var t = this.p.time;
        scale = 120;
        this.p.x = centroX + scale * Math.cos(t);
        this.p.y = centroY + scale * Math.sin(2 * t) / 2;
        if ((this.p.x > centroX && this.p.y < centroY) || (this.p.x < centroX && this.p.y > centroY))
        {
          this.play("napiasR");
        }
        else
        {
          this.play("napiasL");
        }

      }
    }

  });
  //------------------------------------------------------------------------//

  Q.animations("napias_anim",
  {
    napiasR: { frames: [0], flip: false, loop: true, rate: 1 / 10, next: "napiasL" },
    napiasL: { frames: [0], flip: "x", loop: true, rate: 1 / 10, next: "napiasR" },
    napiasStop: { frames: [0], flip: false, loop: false, rate: 1 / 5 }
  });
  //-----------------------------------------------------------------------//

  // NETORA

  Q.Sprite.extend("Netora",
  {
    init: function (p)
    {
      this._super(p,
      {
        sprite: "netora_anim",
        sheet: "netora",
        type: SPRITE_ENEMY,
        collisionMask: SPRITE_BULLET | SPRITE_PLAYER,
        gravity: 0.65,
        frame: 1,
        live: 1,
        exp: 100,
        heart: 1,
        vx: 20,
        hit: 1
      });

      this.add("2d, aiBounce, animation");
      this.on("bump.left, bump.right, bump.top, bump.bottom", this, "hit");
      this.on("hit", this, "killed");
    },

    hit: function (collision)
    {
      if (collision.obj.isA("Pit") && this.p.live <= 0)
      {
        this.destroy();
      }

    },

    killed: function (collision)
    {
      if (collision.obj.isA("Arrow") || collision.obj.isA("ArrowUp"))
      {
        this.p.live--;
        if (this.p.live <= 0)
        {
          this.p.sheet = "medioCorazon";
          this.play("netoraStop");
          this.p.vx = 0;
        }
      }

    },

    step: function (dt)
    {
      if (this.p.live > 0)
      {
        if (this.p.vx > 0) this.play("netoraR");
        if (this.p.vx < 0) this.play("netoraL");
      }
    }

  });
  //------------------------------------------------------------------------//

  Q.animations("netora_anim",
  {
    netoraR: { frames: [0, 1, 2], flip: false, loop: true, rate: 1 / 5 },
    netoraL: { frames: [0, 1, 2], flip: "x", loop: true, rate: 1 / 5 },
    netoraStop: { frames: [0], flip: false, loop: false, rate: 1 / 5 }
  });

  //----------------------------------------------------------------------//

  // SCORE

  Q.UI.Text.extend("Score",
  {
    init: function (p)
    {
        this._super(
        {
          label: "HEARTS: 0 | LIVES: 7",
          color: "white",
          x: 200,
          y: 0
        });

        Q.state.on("change.score", this, "score");
        Q.state.on("change.lives", this, "lives");
    },
    score: function (score)
    {
      this.p.label = "HEARTS: " + score + " | LIVES: " + Q.state.get("lives");
    },
    lives: function (lives)
    {
      this.p.label = "HEARTS: " + Q.state.get("score") + " | LIVES: " + lives;
    } 
  });

  // HUD

  Q.scene("HUD", function (stage)
  {
    stage.insert(new Q.Score());
  });

  // TITULO

  Q.scene("TitleScreen", function (stage)
  {
    //Q.audio.play("Titulo.mp3", { loop: true }); // Reproduce la musica del TitleScreen
    
    stage.insert(new Q.UI.Button(
    {
      asset: "TitleScreen.png",
      x: Q.width / 2,
      y: Q.height / 2,
      scaleToFit: true,
      scale: 2.85
    }))

    Q.input.on("confirm", function()
    {
      //Q.audio.stop();
      Q.clearStages();
      Q.stageScene("Level101");
      Q.stageScene("HUD", 1);
    });

    // Restart hearts and lives
    Q.state.set({ score: 0, lives: 7 });
    //Q.state.set("lives",5);
  });

  // NIVEL 1

  Q.scene("Level101", function (stage)
  {
    Q.audio.play("Nivel_1.mp3", { loop: true }); // Reproduce la musica del Nivel 1
    Q.stageTMX("Level101.tmx", stage);
    const player = stage.insert(new Q.Pit());
    stage.add("viewport").follow(player);
    stage.viewport.scale = 2;
    stage.insert(new Q.Viperix({ x: 60, y: 2666 }));
    stage.insert(new Q.Monoculus({ x: 60, y: 2068, yIni: 2067, yFin: 2164, time: 0 }));
    stage.insert(new Q.Monoculus({ x: 62, y: 2050, yIni: 2049, yFin: 2146, time: 1 }));
    stage.insert(new Q.Funesto({ x: 135, y: 1346, xIni: 135, xFin: 180 }));
    stage.insert(new Q.FunestoM({ x: 135, y: 1046, yIni: 1049, yFin: 1146, time: 0 }));
    stage.insert(new Q.Napias({ x: 135, y: 1046, yIni: 2500, yFin: 2600, time: 1 }));
    stage.insert(new Q.Netora({ x: 70, y: 2666 }));
  });

  // CARGA COMPONENTES

  Q.loadTMX("Level101.tmx , Level1.png , TitleScreen.png, Pit.png, Pit.json, Viperix.png, Viperix.json, Monoculus.png, Monoculus.json, Items.png, Items.json, Funesto.png, Funesto.json, FunestoM.png, FunestoM.json, Napias.png, Napias.json, Netora.png, Netora.json, Titulo.mp3, Nivel_1.mp3, Nivel_Completado.mp3, Game_Over.mp3, Disparo.mp3, Corazon.mp3, Salto.mp3, Puerta.mp3, Final.mp3, Muerte_Serpiente.mp3", function ()
  {
    Q.compileSheets("Pit.png", "Pit.json");
    Q.compileSheets("Viperix.png", "Viperix.json");
    Q.compileSheets("Monoculus.png", "Monoculus.json");
    Q.compileSheets("Items.png", "Items.json");
    Q.compileSheets("Funesto.png", "Funesto.json");
    Q.compileSheets("FunestoM.png", "FunestoM.json");
    Q.compileSheets("Napias.png", "Napias.json");
    Q.compileSheets("Netora.png", "Netora.json");
    Q.stageScene("TitleScreen");
  });
};