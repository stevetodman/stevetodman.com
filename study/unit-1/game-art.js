(function () {
  'use strict';

  var CATALOG = [
  {
    "id":"copper-blade",
    "type":"weapon",
    "name":"Copper Blade",
    "price":8,
    "rarity":"Trail gear",
    "sound":"blade",
    "tone":520
  },
  {
    "id":"moon-blade",
    "type":"weapon",
    "name":"Moon Blade",
    "price":12,
    "rarity":"Moonforged",
    "sound":"blade",
    "tone":1175
  },
  {
    "id":"star-wand",
    "type":"weapon",
    "name":"Star Wand",
    "price":12,
    "rarity":"Starbound",
    "sound":"wand",
    "tone":784
  },
  {
    "id":"forest-hood",
    "type":"armor",
    "name":"Forest Hood",
    "price":16,
    "rarity":"Trail gear",
    "sound":"cloth",
    "tone":460
  },
  {
    "id":"guardian-mail",
    "type":"armor",
    "name":"Guardian Mail",
    "price":24,
    "rarity":"Guardian",
    "sound":"mail",
    "tone":1650
  },
  {
    "id":"star-mantle",
    "type":"armor",
    "name":"Star Mantle",
    "price":24,
    "rarity":"Starbound",
    "sound":"cloth",
    "tone":980
  },
  {
    "id":"oak-staff",
    "type":"weapon",
    "name":"Oak Staff",
    "price":20,
    "rarity":"Woodland",
    "sound":"wood",
    "tone":180
  },
  {
    "id":"iron-axe",
    "type":"weapon",
    "name":"Iron Axe",
    "price":28,
    "rarity":"Forged",
    "sound":"axe",
    "tone":430
  },
  {
    "id":"hunter-bow",
    "type":"weapon",
    "name":"Hunter Bow",
    "price":32,
    "rarity":"Ranger",
    "sound":"bow",
    "tone":240
  },
  {
    "id":"frost-spear",
    "type":"weapon",
    "name":"Frost Spear",
    "price":40,
    "rarity":"Frostbound",
    "sound":"spear",
    "tone":1380
  },
  {
    "id":"ember-hammer",
    "type":"weapon",
    "name":"Ember Hammer",
    "price":48,
    "rarity":"Emberforged",
    "sound":"hammer",
    "tone":220
  },
  {
    "id":"thunder-blade",
    "type":"weapon",
    "name":"Thunder Blade",
    "price":60,
    "rarity":"Stormforged",
    "sound":"blade",
    "tone":860
  },
  {
    "id":"crystal-wand",
    "type":"weapon",
    "name":"Crystal Wand",
    "price":72,
    "rarity":"Crystal",
    "sound":"wand",
    "tone":1046
  },
  {
    "id":"dragon-blade",
    "type":"weapon",
    "name":"Dragon Blade",
    "price":96,
    "rarity":"Dragon",
    "sound":"blade",
    "tone":610
  },
  {
    "id":"void-scythe",
    "type":"weapon",
    "name":"Void Scythe",
    "price":120,
    "rarity":"Legendary",
    "sound":"scythe",
    "tone":320
  },
  {
    "id":"iron-shield",
    "type":"armor",
    "name":"Iron Shield",
    "price":20,
    "rarity":"Forged",
    "sound":"shield",
    "tone":380
  },
  {
    "id":"ember-buckler",
    "type":"armor",
    "name":"Ember Buckler",
    "price":28,
    "rarity":"Emberforged",
    "sound":"shield",
    "tone":570
  },
  {
    "id":"crystal-shield",
    "type":"armor",
    "name":"Crystal Shield",
    "price":40,
    "rarity":"Crystal",
    "sound":"shield",
    "tone":1280
  },
  {
    "id":"thunder-shield",
    "type":"armor",
    "name":"Thunder Shield",
    "price":56,
    "rarity":"Stormforged",
    "sound":"shield",
    "tone":760
  },
  {
    "id":"dragon-shield",
    "type":"armor",
    "name":"Dragon Shield",
    "price":80,
    "rarity":"Dragon",
    "sound":"shield",
    "tone":290
  },
  {
    "id":"void-shield",
    "type":"armor",
    "name":"Void Shield",
    "price":112,
    "rarity":"Legendary",
    "sound":"shield",
    "tone":190
  },
  {
    "id":"oak-charm",
    "type":"armor",
    "name":"Oak Charm",
    "price":32,
    "rarity":"Woodland",
    "sound":"charm",
    "tone":660
  },
  {
    "id":"frost-charm",
    "type":"armor",
    "name":"Frost Charm",
    "price":64,
    "rarity":"Frostbound",
    "sound":"charm",
    "tone":1320
  },
  {
    "id":"sun-charm",
    "type":"armor",
    "name":"Sun Charm",
    "price":100,
    "rarity":"Legendary",
    "sound":"charm",
    "tone":880
  }
];
  var VALID_ITEMS = ['starter-sword','starter-cloak'].concat(CATALOG.map(function (item) { return item.id; }));
  var PALETTES = {
    Luke:{ skin:'#c88457', hair:'#3e2b29', tunic:'#2a8b82', accent:'#f1b449', cape:'#184b68' },
    Samantha:{ skin:'#b86f4d', hair:'#3d2530', tunic:'#6969ba', accent:'#f1b449', cape:'#8b3f6b' }
  };

  function weaponMarkup(id) {
    if (id === 'star-wand') return '<g class="gear weapon wand"><path d="M73 66 91 29"/><circle cx="94" cy="23" r="7"/><path class="spark" d="m94 9 2 8 8 2-8 3-2 8-3-8-8-3 8-2Z"/></g>';
    if (id === 'moon-blade') return '<g class="gear weapon moon"><path d="M73 66 91 31"/><path class="blade" d="m88 34 7-20 6 10-5 14Z"/><path d="m83 41 12 6"/></g>';
    return '<g class="gear weapon '+(id==='copper-blade'?'copper':'starter')+'"><path d="M73 66 91 32"/><path class="blade" d="m88 34 7-21 6 11-5 14Z"/><path d="m83 41 12 6"/></g>';
  }

  function armorMarkup(id, palette) {
    if (id === 'forest-hood') return '<path class="cape forest" d="M31 55q6-22 29-22t30 22l-9 48H38Z"/><path class="hood forest" d="M38 46q3-27 22-27t24 27q-10-10-24-10T38 46Z"/>';
    if (id === 'guardian-mail') return '<path class="cape guardian" d="M33 55q7-17 27-17t29 17l-5 48H37Z"/><path class="mail" d="M43 50h34l8 53H36Z"/><path class="mail-line" d="M43 63h36M40 76h42M39 89h44"/>';
    if (id === 'star-mantle') return '<path class="cape star" d="M31 55q7-20 29-20t31 20l-8 48H37Z"/><path class="star-mark" d="m60 57 4 9 10 1-8 7 2 10-8-5-9 5 2-10-7-7 10-1Z"/>';
    return '<path class="cape starter" style="--cape:'+palette.cape+'" d="M33 56q7-18 27-18t29 18l-7 47H38Z"/>';
  }

  function hero(name, equipped, pose) {
    var p=PALETTES[name]||PALETTES.Luke;
    var weapon=equipped&&equipped.weapon||'starter-sword';
    var armor=equipped&&equipped.armor||'starter-cloak';
    return '<svg class="hero-art hero-'+(pose||'ready')+'" viewBox="0 0 120 120" aria-hidden="true" focusable="false">'+
      '<ellipse class="hero-shadow" cx="60" cy="107" rx="29" ry="7"/>'+armorMarkup(armor,p)+
      '<path class="hero-body" style="--tunic:'+p.tunic+'" d="M43 54q7-8 17-8t18 8l8 48H35Z"/>'+
      '<path class="hero-belt" style="--accent:'+p.accent+'" d="M38 78h46v8H38Z"/>'+
      '<path class="hero-leg" d="m45 99-3 11h13l4-11m15 0 3 11H64l-3-11"/>'+
      '<circle class="hero-head" style="--skin:'+p.skin+'" cx="60" cy="37" r="20"/>'+
      '<path class="hero-hair" style="--hair:'+p.hair+'" d="M40 38q0-23 20-23 18 0 21 17-9-8-19-6-8 2-12-3-2 9-10 15Z"/>'+
      '<circle class="hero-eye" cx="53" cy="39" r="2"/><circle class="hero-eye" cx="68" cy="39" r="2"/>'+
      '<path class="hero-smile" d="M55 48q5 4 10 0"/>'+weaponMarkup(weapon)+'</svg>';
  }

  function monster(kind, state) {
    var cls='monster-art monster-'+kind+' monster-'+(state||'ready');
    if (kind === 'wisp') return '<svg class="'+cls+'" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><ellipse class="monster-shadow" cx="60" cy="107" rx="30" ry="7"/><path class="wisp-tail" d="M42 92q-9 10 4 18 1-9 10-10 13 10 21 1 5-6 1-13Z"/><path class="wisp-body" d="M29 64q0-36 31-36t32 36q0 33-32 36T29 64Z"/><path class="wisp-horn" d="m38 38-8-21 19 13m34 8 8-21-19 13"/><circle class="monster-eye" cx="49" cy="62" r="5"/><circle class="monster-eye" cx="73" cy="62" r="5"/><path class="monster-mouth" d="M53 79q8-5 16 0"/></svg>';
    if (kind === 'sentinel') return '<svg class="'+cls+'" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><ellipse class="monster-shadow" cx="60" cy="108" rx="35" ry="7"/><path class="stone-body" d="m29 48 14-19h35l14 19 8 42-17 17H37L20 90Z"/><path class="stone-plate" d="m42 29 6-14h25l6 14M31 55l-14 9 6 20m66-29 14 9-6 20"/><circle class="monster-eye glow" cx="48" cy="61" r="5"/><circle class="monster-eye glow" cx="73" cy="61" r="5"/><path class="stone-rune" d="m60 74-8 12 8 9 9-9Z"/></svg>';
    if (kind === 'boss') return '<svg class="'+cls+'" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><ellipse class="monster-shadow" cx="60" cy="109" rx="38" ry="7"/><path class="boss-cape" d="M24 50q10-26 36-26t37 26l8 54H16Z"/><path class="boss-body" d="M28 53q6-29 32-29t33 29l-8 52H36Z"/><path class="boss-crown" d="m39 30 5-19 15 13L74 10l7 20Z"/><circle class="monster-eye boss-eye" cx="49" cy="59" r="5"/><circle class="monster-eye boss-eye" cx="73" cy="59" r="5"/><path class="monster-mouth" d="M52 78q9-6 18 0"/><path class="boss-rune" d="m60 83 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z"/></svg>';
    return '<svg class="'+cls+'" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><ellipse class="monster-shadow" cx="60" cy="108" rx="34" ry="7"/><path class="moss-body" d="M25 71q2-35 35-35t36 35q0 34-36 36T25 71Z"/><path class="moss-horn" d="m37 44-14-21 27 13m33 8 14-21-27 13"/><path class="moss-leaf" d="M54 35q-3-20 14-23 2 16-14 23Z"/><circle class="monster-eye" cx="48" cy="68" r="5"/><circle class="monster-eye" cx="73" cy="68" r="5"/><path class="monster-mouth" d="M52 85q9-5 17 0"/></svg>';
  }

  function itemIcon(item) {
    if (item.type === 'weapon') return '<svg class="item-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">'+weaponMarkup(item.id)+'</svg>';
    return '<svg class="item-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">'+armorMarkup(item.id,PALETTES.Luke)+'</svg>';
  }

  function routeMap(step) {
    var safeStep=Math.max(0,Math.min(12,Number(step)||0));
    var points=[[13,80],[28,66],[46,78],[65,59],[87,69],[106,49],[129,58],[149,38],[172,48],[192,28],[215,38],[239,18]];
    var circles=points.map(function (point,index) {
      var reached=index<safeStep?' reached':'';
      return '<g class="route-node'+reached+'"><circle cx="'+point[0]+'" cy="'+point[1]+'" r="6"/><text x="'+point[0]+'" y="'+(point[1]+2.6)+'">'+(index+1)+'</text></g>';
    }).join('');
    var marker=points[Math.max(0,Math.min(points.length-1,safeStep?safeStep-1:0))];
    return '<svg class="route-art" viewBox="0 0 252 98" role="img" aria-label="Expedition route, '+safeStep+' of 12 travel steps reached">'+
      '<path class="route-ground" d="M13 80 28 66 46 78 65 59 87 69 106 49 129 58 149 38 172 48 192 28 215 38 239 18"/>'+circles+
      '<g class="route-marker" transform="translate('+(marker[0]-4)+' '+(marker[1]-20)+')"><path d="M4 16 0 7l4-7 4 7Z"/><circle cx="4" cy="7" r="2"/></g></svg>';
  }

  // The generated atlas was inspected and is not an equal-cell grid. Explicit
  // crop windows preserve each complete character; the SVGs only clip raster art.
  var ATLAS='/study/unit-1/assets/expedition-sprites.webp';
  var COLS=[0,314,628,942],ROWS=[0,330,654,946],HEIGHTS=[330,324,292,308];
  function sprite(col,row,cls){
    return '<svg class="'+cls+'" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><svg x="0" y="0" width="120" height="120" viewBox="'+COLS[col]+' '+ROWS[row]+' 314 '+HEIGHTS[row]+'" preserveAspectRatio="none" overflow="hidden"><image href="'+ATLAS+'" width="1254" height="1254"/></svg></svg>';
  }
  // Art slots and attachment points belong to the item, never its shop order.
  // Grip/tip coordinates are pixels inside the inspected source cell.
  var EXTRA_GEAR={
    'oak-staff':{cell:[0,0],grip:[89,239],tip:[208,55],height:77,tilt:-12},
    'iron-axe':{cell:[1,0],grip:[100,244],tip:[190,75],height:70,tilt:-12},
    'hunter-bow':{cell:[2,0],grip:[79,190],tip:[79,190],height:69,tilt:-8},
    'frost-spear':{cell:[3,0],grip:[68,254],tip:[207,55],height:78,tilt:-18},
    'ember-hammer':{cell:[4,0],grip:[89,250],tip:[176,105],height:72,tilt:-14},
    'thunder-blade':{cell:[5,0],grip:[64,277],tip:[214,54],height:70,tilt:-12},
    'crystal-wand':{cell:[0,1],grip:[94,242],tip:[201,39],height:72,tilt:-12},
    'dragon-blade':{cell:[1,1],grip:[69,240],tip:[208,28],height:70,tilt:-12},
    'void-scythe':{cell:[2,1],grip:[109,227],tip:[25,108],height:77,tilt:-12},
    'iron-shield':{cell:[3,1],grip:[112,172],height:52,tilt:0},
    'ember-buckler':{cell:[4,1],grip:[105,170],height:49,tilt:0},
    'crystal-shield':{cell:[5,1],grip:[112,170],height:53,tilt:0},
    'thunder-shield':{cell:[0,2],grip:[128,150],height:53,tilt:0},
    'dragon-shield':{cell:[1,2],grip:[128,150],height:53,tilt:0},
    'void-shield':{cell:[2,2],grip:[128,150],height:53,tilt:0},
    'oak-charm':{cell:[3,2],grip:[128,25],height:27,tilt:0},
    'frost-charm':{cell:[4,2],grip:[128,25],height:27,tilt:0},
    'sun-charm':{cell:[5,2],grip:[128,25],height:27,tilt:0}
  };
  var STARTER_GEAR={
    'starter-sword':{col:0,grip:[88,230],tip:[270,23],height:62,tilt:-12},
    'copper-blade':{col:1,grip:[85,228],tip:[263,33],height:62,tilt:-12},
    'moon-blade':{col:2,grip:[99,230],tip:[218,15],height:66,tilt:-15},
    'star-wand':{col:3,grip:[104,222],tip:[216,63],height:65,tilt:-12}
  };
  var HERO_HANDS={
    Luke:[[[90,77],[43,46],[95,78],[43,70]],[[89,77],[39,34],[100,72],[42,65]],[[83,77],[39,40],[97,72],[42,67]],[[83,77],[37,41],[97,71],[38,66]]],
    Samantha:[[[90,74],[51,52],[97,78],[50,72]],[[89,74],[48,50],[97,72],[50,63]],[[83,74],[46,35],[97,72],[47,66]],[[85,75],[46,43],[96,72],[44,66]]]
  };
  var nextGripMask=0;
  function extraItem(id){return Object.prototype.hasOwnProperty.call(EXTRA_GEAR,id)?1:-1;}
  function gearSpec(id){return EXTRA_GEAR[id]||STARTER_GEAR[id]||STARTER_GEAR['starter-sword'];}
  function gearRaster(id,width,height){
    var spec=gearSpec(id),extra=extraItem(id)>=0,cw=extra?256:314,ch=extra?341.333333:HEIGHTS[3];
    var x=extra?spec.cell[0]*cw:COLS[spec.col],y=extra?spec.cell[1]*ch:ROWS[3];
    // Inner viewport clips the cell; outer viewport preserves its proportions.
    return '<svg width="'+width+'" height="'+height+'" viewBox="0 0 '+cw+' '+ch+'" preserveAspectRatio="xMidYMid meet" overflow="hidden"><svg width="'+cw+'" height="'+ch+'" viewBox="'+x+' '+y+' '+cw+' '+ch+'" preserveAspectRatio="none" overflow="hidden"><image href="'+(extra?'/study/unit-1/assets/extra-gear.webp':ATLAS)+'" width="'+(extra?1536:1254)+'" height="'+(extra?1024:1254)+'"/></svg></svg>';
  }
  function extraSprite(id,cls){
    return '<svg width="120" height="120" class="'+cls+' extra-item" viewBox="0 0 120 120" aria-hidden="true" focusable="false">'+gearRaster(id,120,120)+'</svg>';
  }
  function equippedGear(id,cls,mask){
    var spec=gearSpec(id),extra=extraItem(id)>=0,s=spec.height/(extra?341.333333:HEIGHTS[3]),width=(extra?256:314)*s;
    return '<g class="gear '+cls+'" data-item-art="'+id+'"'+(mask?' mask="url(#'+mask+')"':'')+'><g transform="rotate('+spec.tilt+')"><g transform="translate('+(-spec.grip[0]*s)+' '+(-spec.grip[1]*s)+')">'+gearRaster(id,width,spec.height)+'</g></g></g>';
  }
  function illustratedHero(name,equipped,pose){
    var armor=equipped&&equipped.armor||'starter-cloak',weapon=equipped&&equipped.weapon||'starter-sword';
    var ac=Math.max(0,['starter-cloak','forest-hood','guardian-mail','star-mantle'].indexOf(armor));
    var extraArmor=extraItem(armor)>=0,hands=HERO_HANDS[name]||HERO_HANDS.Luke,hand=hands[ac],mask='gear-grip-'+(++nextGripMask);
    var gripStyle=['wind','hit','recover'].map(function(key,i){return '--grip-'+key+':translate('+(hand[i+1][0]-hand[0][0])+'px,'+(hand[i+1][1]-hand[0][1])+'px)';}).join(';');
    var fit=gearSpec(weapon),scale=fit.height/(extraItem(weapon)>=0?341.333333:HEIGHTS[3]),angle=(fit.tilt+(combatProfile(weapon).attack==='thrust'?60:55))*Math.PI/180;
    var tip=fit.tip||fit.grip,reach=(hand[2][0]+((tip[0]-fit.grip[0])*Math.cos(angle)-(tip[1]-fit.grip[1])*Math.sin(angle))*scale)/120;
    // Inspected crop windows: the generated sheet is not an equal-cell grid.
    var px=[0,260,563,790,1026,1300],pw=[250,300,220,232,275,225],py=[0,260,510,760];
    var frames=['windup','contact','recover'].map(function(frame,index){
      var col=(name==='Samantha'?3:0)+index;
      return '<g class="hero-frame frame-'+frame+'"><svg width="108" height="120" viewBox="'+px[col]+' '+py[ac]+' '+pw[col]+' 250" preserveAspectRatio="none" overflow="hidden"><image href="/study/unit-1/assets/hero-poses.webp" width="1536" height="1024"/></svg></g>';
    }).join('');
    return '<svg class="hero-art hero-'+(pose||'ready')+'" viewBox="0 0 120 120" data-learner="'+name+'" data-armor="'+armor+'" data-weapon="'+weapon+'" data-reach="'+reach.toFixed(3)+'" style="'+gripStyle+'" aria-hidden="true" focusable="false">'+
      '<defs><mask id="'+mask+'" maskUnits="userSpaceOnUse" x="-120" y="-120" width="240" height="240"><rect x="-120" y="-120" width="240" height="240" fill="white"/><circle cx="0" cy="0" r="3" fill="black"/></mask></defs>'+
      '<g class="hero-idle">'+
      '<svg x="0" y="0" width="108" height="120" viewBox="'+COLS[ac]+' '+ROWS[name==='Samantha'?1:0]+' 314 '+HEIGHTS[name==='Samantha'?1:0]+'" preserveAspectRatio="none" overflow="hidden"><image href="'+ATLAS+'" width="1254" height="1254"/></svg>'+
      '</g>'+frames+'<g class="weapon-anchor" transform="translate('+hand[0].join(' ')+')"><g class="weapon-grip"><g class="weapon-motion">'+equippedGear(weapon,'weapon',mask)+'</g></g></g>'+
      (extraArmor?'<g class="armor-anchor" data-slot="'+(armor.indexOf('charm')>=0?'neck':'offhand')+'" transform="translate('+(armor.indexOf('charm')>=0?'55 48':'29 74')+')"><g class="armor-grip"><g class="armor-motion">'+equippedGear(armor,'armor')+'</g></g></g>':'')+'</svg>';
  }
  function illustratedMonster(kind,state){
    var index=Math.max(0,['mossling','wisp','sentinel','boss'].indexOf(kind)),x=(index%2)*627,y=Math.floor(index/2)*627;
    return '<svg class="monster-art monster-cutout monster-'+kind+' monster-'+(state||'ready')+'" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><svg width="120" height="120" viewBox="'+x+' '+y+' 627 627" preserveAspectRatio="none" overflow="hidden"><image href="/study/unit-1/assets/monster-sprites.webp" width="1254" height="1254"/></svg></svg>';
  }
  function illustratedItem(item){if(extraItem(item.id)>=0)return extraSprite(item.id,'item-art');return item.type==='weapon'?sprite(Math.max(0,['starter-sword','copper-blade','moon-blade','star-wand'].indexOf(item.id)),3,'item-art'):sprite(Math.max(0,['starter-cloak','forest-hood','guardian-mail','star-mantle'].indexOf(item.id)),0,'item-art');}
  // Presentation only. Contact seconds drive both CSS motion and audio scheduling.
  function combatProfile(id){
    var item=CATALOG.find(function(item){return item.id===id;});
    var family=item?item.sound:id==='starter-cloak'?'cloth':'blade';
    var attacks={blade:['slash',.18],axe:['chop',.23],hammer:['smash',.28],spear:['thrust',.17],wood:['sweep',.22],scythe:['sweep',.22],bow:['shoot',.22],wand:['cast',.24]};
    var attack=attacks[family]||attacks.blade;
    var element=/ember|sun-/.test(id)?'fire':/frost/.test(id)?'ice':/thunder/.test(id)?'lightning':/void/.test(id)?'void':/crystal/.test(id)?'crystal':/star/.test(id)?'star':/moon/.test(id)?'moon':/oak|forest|hunter/.test(id)?'wood':'steel';
    var defense=family==='shield'?'shield':family==='mail'?'brace':family==='charm'||id==='star-mantle'?'barrier':'evade';
    return {attack:attack[0],contact:attack[1],element:element,defense:defense,family:family};
  }
  window.WordExpeditionArt={ catalog:CATALOG, validItems:VALID_ITEMS, hero:illustratedHero, monster:illustratedMonster, itemIcon:illustratedItem, routeMap:routeMap, combatProfile:combatProfile };
})();
