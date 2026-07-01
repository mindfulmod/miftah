(function (ns) {
  const base = "assets/generated/";

  // Note: assets/generated/world/world_oasis_backdrop.png stays on disk but is
  // intentionally not referenced — the live map renders from tile data + props.
  ns.ASSETS = {
    terrain: {
      water: `${base}terrain/terrain_water_01.png`,
      waterRipple: `${base}terrain/terrain_water_ripple.png`,
      lagoon: `${base}terrain/terrain_lagoon_01.png`,
      lilyWater: `${base}terrain/terrain_water_lily.png`,
      grass: `${base}terrain/terrain_grass_01.png`,
      flowers: `${base}terrain/terrain_grass_flowers.png`,
      sand: `${base}terrain/terrain_sand_01.png`,
      path: `${base}terrain/path_fill.png`,
      pathH: `${base}terrain/path_horizontal.png`,
      pathV: `${base}terrain/path_vertical.png`,
      pathCross: `${base}terrain/path_cross.png`,
      bridgeH: `${base}terrain/bridge_horizontal.png`,
      bridgeV: `${base}terrain/bridge_vertical.png`,
      dock: `${base}terrain/dock_tile.png`,
      courtyard: `${base}terrain/courtyard_plain.png`,
      courtyardStar: `${base}terrain/courtyard_star.png`,
      irrigationH: `${base}terrain/irrigation_horizontal.png`,
      irrigationV: `${base}terrain/irrigation_vertical.png`,
      irrigationCross: `${base}terrain/irrigation_cross.png`,
      sandbar: `${base}terrain/tiny_sandbar.png`,
    },
    buildings: {
      readingArch: `${base}buildings/building_reading_arch.png`,
      pavilion: `${base}buildings/building_pavilion.png`,
      honeycombHub: `${base}buildings/building_honeycomb_hub.png`,
      barn: `${base}buildings/building_barn.png`,
      stable: `${base}buildings/building_stable.png`,
      dogHouse: `${base}buildings/building_dog_house.png`,
      catNook: `${base}buildings/building_cat_nook.png`,
    },
    props: {
      fountain: `${base}props/prop_fountain.png`,
      matBlue: `${base}props/prop_geometric_mat_blue.png`,
      hatcheryCradle: `${base}props/prop_hatchery_cradle.png`,
      hatchingEgg: `${base}props/prop_hatching_egg.png`,
      lantern: `${base}props/prop_lantern.png`,
      palm: `${base}props/prop_palm.png`,
      datePalm: `${base}props/prop_date_palm.png`,
      tree: `${base}props/prop_tree.png`,
      orangeTree: `${base}props/prop_orange_tree.png`,
      doveNestingTree: `${base}props/prop_dove_nesting_tree.png`,
      ababeelPerches: `${base}props/prop_ababeel_perches.png`,
      fishMotif: `${base}props/prop_fish_motif.png`,
      spiderGrotto: `${base}props/prop_spider_grotto.png`,
      snakeHabitat: `${base}props/prop_snake_habitat.png`,
      camelSpring: `${base}props/prop_camel_spring.png`,
      elephantGrove: `${base}props/prop_elephant_grove.png`,
      crowOrchard: `${base}props/prop_crow_rocky_orchard.png`,
      bush: `${base}props/prop_bush.png`,
      flowers: `${base}props/prop_flowers.png`,
      reeds: `${base}props/prop_reeds.png`,
      rocks: `${base}props/prop_rocks.png`,
      barrel: `${base}props/prop_barrel.png`,
      jar: `${base}props/prop_jar.png`,
      crate: `${base}props/prop_crate.png`,
      hay: `${base}props/prop_hay.png`,
      lilyPads: `${base}props/prop_lily_pads.png`,
      fenceH: `${base}props/prop_fence_horizontal.png`,
      fenceV: `${base}props/prop_fence_vertical.png`,
      pastureGate: `${base}props/prop_pasture_gate.png`,
      signBee: `${base}props/prop_sign_bee.png`,
      signCrop: `${base}props/prop_sign_crop.png`,
      signSeed: `${base}props/prop_sign_seed.png`,
    },
    characters: {
      player: {
        idle: {
          down: `${base}characters/player_idle_down.png`,
          up: `${base}characters/player_idle_up.png`,
          left: `${base}characters/player_idle_left.png`,
          right: `${base}characters/player_idle_right.png`,
        },
        walk: {
          down: [
            `${base}characters/player_walk_down_01.png`,
            `${base}characters/player_walk_down_02.png`,
            `${base}characters/player_walk_down_03.png`,
          ],
          up: [
            `${base}characters/player_walk_up_01.png`,
            `${base}characters/player_walk_up_02.png`,
            `${base}characters/player_walk_up_03.png`,
          ],
          left: [
            `${base}characters/player_walk_left_01.png`,
            `${base}characters/player_walk_left_02.png`,
            `${base}characters/player_walk_left_03.png`,
          ],
          right: [
            `${base}characters/player_walk_right_01.png`,
            `${base}characters/player_walk_right_02.png`,
            `${base}characters/player_walk_right_03.png`,
          ],
        },
      },
      villagers: [
        `${base}characters/npc_villager_01.png`,
        `${base}characters/npc_villager_02.png`,
        `${base}characters/npc_villager_03.png`,
      ],
    },
    animals: {
      cat: {
        idle: {
          down: `${base}animals/cat_idle_down.png`,
          up: `${base}animals/cat_idle_up.png`,
          left: `${base}animals/cat_idle_left.png`,
          right: `${base}animals/cat_idle_right.png`,
        },
        walk: {
          down: [`${base}animals/cat_walk_down_01.png`, `${base}animals/cat_walk_down_02.png`],
          up: [`${base}animals/cat_walk_up_01.png`, `${base}animals/cat_walk_up_02.png`],
          left: [`${base}animals/cat_walk_left_01.png`, `${base}animals/cat_walk_left_02.png`],
          right: [`${base}animals/cat_walk_right_01.png`, `${base}animals/cat_walk_right_02.png`],
        },
      },
      cow: {
        idle: [`${base}animals/cow_idle_down.png`],
        walk: [`${base}animals/cow_walk_down_01.png`, `${base}animals/cow_walk_down_02.png`],
      },
      sheep: {
        idle: [`${base}animals/sheep_idle_down.png`],
        walk: [`${base}animals/sheep_walk_down_01.png`],
      },
      horse: {
        idle: [`${base}animals/horse_idle_down.png`],
      },
      bee: {
        fly: [`${base}animals/bee_fly_01.png`, `${base}animals/bee_idle_down.png`],
      },
      dove: {
        fly: [`${base}animals/adult_dove_fly_01.png`, `${base}animals/adult_dove_idle_down.png`],
      },
      fish: {
        swim: [`${base}animals/massive_fish_idle.png`, `${base}animals/massive_fish_swim_01.png`],
      },
      collection: {
        cow: {
          stages: [
            `${base}animals/baby_cow_idle_down.png`,
            `${base}animals/teenage_cow_idle_down.png`,
            `${base}animals/adult_cow_idle_down.png`,
          ],
        },
        horse: {
          stages: [
            `${base}animals/baby_horse_idle_down.png`,
            `${base}animals/teenage_horse_idle_down.png`,
            `${base}animals/adult_horse_idle_down.png`,
          ],
        },
        sheep: {
          stages: [
            `${base}animals/baby_sheep_idle_down.png`,
            `${base}animals/teenage_sheep_idle_down.png`,
            `${base}animals/adult_sheep_idle_down.png`,
          ],
        },
        cat: {
          stages: [
            `${base}animals/kitten_idle_down.png`,
            `${base}animals/teenage_cat_idle_down.png`,
            `${base}animals/adult_cat_idle_down.png`,
          ],
        },
        dog: {
          stages: [
            `${base}animals/puppy_idle_down.png`,
            `${base}animals/teenage_dog_idle_down.png`,
            `${base}animals/adult_dog_idle_down.png`,
          ],
        },
        bee: {
          stages: [
            `${base}animals/bee_larva_idle_down.png`,
            `${base}animals/bee_pupa_idle_down.png`,
            `${base}animals/bee_idle_down.png`,
          ],
        },
        ant: {
          stages: [
            `${base}animals/ant_larva_idle_down.png`,
            `${base}animals/ant_pupa_idle_down.png`,
            `${base}animals/ant_idle_down.png`,
          ],
        },
        spider: {
          stages: [
            `${base}animals/spider_egg_idle_down.png`,
            `${base}animals/baby_spider_idle_down.png`,
            `${base}animals/spider_idle_down.png`,
          ],
        },
        snake: {
          stages: [
            `${base}animals/baby_snake_idle_down.png`,
            `${base}animals/teenage_snake_idle_down.png`,
            `${base}animals/adult_snake_idle_down.png`,
          ],
        },
        elephant: {
          stages: [
            `${base}animals/baby_elephant_idle_down.png`,
            `${base}animals/teenage_elephant_idle_down.png`,
            `${base}animals/adult_elephant_idle_down.png`,
          ],
        },
        hoopoe: {
          stages: [
            `${base}animals/baby_hoopoe_idle_down.png`,
            `${base}animals/teenage_hoopoe_idle_down.png`,
            `${base}animals/adult_hoopoe_idle_down.png`,
          ],
        },
        crow: {
          stages: [
            `${base}animals/baby_crow_idle_down.png`,
            `${base}animals/teenage_crow_idle_down.png`,
            `${base}animals/adult_crow_idle_down.png`,
          ],
        },
        ababeel: {
          stages: [
            `${base}animals/baby_ababeel_idle_down.png`,
            `${base}animals/teenage_ababeel_idle_down.png`,
            `${base}animals/adult_ababeel_idle_down.png`,
          ],
        },
        dove: {
          stages: [
            `${base}animals/baby_dove_idle_down.png`,
            `${base}animals/teenage_dove_idle_down.png`,
            `${base}animals/adult_dove_idle_down.png`,
          ],
        },
        camel: {
          stages: [
            `${base}animals/baby_red_camel_idle_down.png`,
            `${base}animals/teenage_red_camel_idle_down.png`,
            `${base}animals/adult_red_camel_idle_down.png`,
          ],
        },
        fish: {
          stages: [
            `${base}animals/small_fish_idle.png`,
            `${base}animals/larger_fish_idle.png`,
            `${base}animals/massive_fish_idle.png`,
          ],
        },
      },
    },
    crops: {
      soilEmpty: `${base}crops/crop_soil_empty.png`,
      soilWatered: `${base}crops/crop_soil_watered.png`,
      seed: `${base}crops/crop_seed.png`,
      sprout: `${base}crops/crop_sprout.png`,
      medium: `${base}crops/crop_medium.png`,
      matureCarrot: `${base}crops/crop_mature_carrot.png`,
      wheatMature: `${base}crops/crop_mature_wheat.png`,
      berriesMature: `${base}crops/crop_mature_berries.png`,
      leafyMature: `${base}crops/crop_mature_leafy.png`,
      kinds: {
        carrot: {
          seed: `${base}crops/crop_seed_carrot.png`,
          sprout: `${base}crops/crop_sprout_carrot.png`,
          medium: `${base}crops/crop_medium_carrot.png`,
          mature: `${base}crops/crop_mature_carrot.png`,
        },
        wheat: {
          seed: `${base}crops/crop_seed_wheat.png`,
          sprout: `${base}crops/crop_sprout_wheat.png`,
          medium: `${base}crops/crop_medium_wheat.png`,
          mature: `${base}crops/crop_mature_wheat.png`,
        },
        berries: {
          seed: `${base}crops/crop_seed_berries.png`,
          sprout: `${base}crops/crop_sprout_berries.png`,
          medium: `${base}crops/crop_medium_berries.png`,
          mature: `${base}crops/crop_mature_berries.png`,
        },
        leafy: {
          seed: `${base}crops/crop_seed_leafy.png`,
          sprout: `${base}crops/crop_sprout_leafy.png`,
          medium: `${base}crops/crop_medium_leafy.png`,
          mature: `${base}crops/crop_mature_leafy.png`,
        },
        datePalm: {
          seed: `${base}crops/crop_seed_date_palm.png`,
          sprout: `${base}crops/crop_sprout_date_palm.png`,
          medium: `${base}crops/crop_medium_date_palm.png`,
          mature: `${base}crops/crop_mature_date_palm.png`,
        },
      },
      basket: `${base}crops/harvest_basket.png`,
      seedPacket: `${base}crops/seed_packet_icon.png`,
      wateringCan: `${base}crops/tool_watering_can.png`,
      hoe: `${base}crops/tool_hoe.png`,
    },
    ui: {
      hudPanel: `${base}ui/ui_hud_panel.png`,
      inventorySlot: `${base}ui/ui_inventory_slot.png`,
      seedIcon: `${base}ui/ui_seed_icon.png`,
      cropIcon: `${base}ui/ui_crop_icon.png`,
      interactionKey: `${base}ui/ui_interaction_key.png`,
      dialogueBox: `${base}ui/ui_dialogue_box.png`,
    },
  };
})(window.MiftahGame || (window.MiftahGame = {}));
