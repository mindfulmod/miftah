#!/usr/bin/env python3
"""Map the miftah-characters-crops sheet onto the game's character/animal/crop/
tool files. Animals reuse one gorgeous pose across every growth stage and
direction (static but consistent); the player's four facings map onto their
idle + walk frames. Each output is contain-fit to the engine's display size."""
import os, json, glob
from importlib import import_module
from PIL import Image

sl = import_module("slice-sheets")
GEN = "assets/generated"
dims = json.load(open("scripts/asset-dims.json"))
SHEET = "assets/tilesets/miftah-characters-crops.png"

# sprite index -> list of target globs (relative to assets/generated)
MAP = {
    # player: idle + walk frames per facing
    0: ["characters/player_idle_down.png", "characters/player_walk_down_*.png"],
    1: ["characters/player_idle_up.png", "characters/player_walk_up_*.png"],
    2: ["characters/player_idle_left.png", "characters/player_walk_left_*.png"],
    3: ["characters/player_idle_right.png", "characters/player_walk_right_*.png"],
    4: ["characters/npc_villager_01.png"],
    5: ["characters/npc_villager_02.png"],
    6: ["characters/npc_villager_03.png"],
    # animals — one pose across all stages/dirs
    11: ["animals/adult_cow*", "animals/teenage_cow*", "animals/cow_idle*"],
    12: ["animals/baby_cow*"],
    13: ["animals/*horse*"],
    14: ["animals/adult_sheep*", "animals/teenage_sheep*", "animals/sheep_idle*"],
    17: ["animals/baby_sheep*"],
    15: ["animals/*dog*", "animals/puppy*"],
    16: ["animals/*cat*", "animals/kitten*"],
    18: ["animals/bee_idle*"],
    19: ["animals/ant_idle*"],
    20: ["animals/spider_idle*", "animals/baby_spider*"],
    21: ["animals/*snake*"],
    22: ["animals/*elephant*"],
    23: ["animals/*hoopoe*"],
    24: ["animals/*crow*"],
    25: ["animals/*ababeel*"],
    26: ["animals/*dove*"],
    27: ["animals/*camel*"],
    # crops
    32: ["crops/crop_seed_wheat.png", "crops/crop_seed.png"],
    33: ["crops/crop_sprout_wheat.png", "crops/crop_sprout.png"],
    34: ["crops/crop_medium_wheat.png", "crops/crop_medium.png"],
    28: ["crops/crop_mature_wheat.png"],
    36: ["crops/crop_sprout_berries.png", "crops/crop_sprout_leafy.png"],
    37: ["crops/crop_medium_berries.png", "crops/crop_medium_leafy.png"],
    38: ["crops/crop_mature_berries.png", "crops/crop_mature_leafy.png"],
    40: ["crops/crop_seed_carrot.png", "crops/crop_sprout_carrot.png", "crops/crop_medium_carrot.png"],
    42: ["crops/crop_mature_carrot.png"],
    41: ["crops/crop_seed_date_palm.png", "crops/crop_sprout_date_palm.png", "crops/crop_medium_date_palm.png"],
    31: ["crops/crop_mature_date_palm.png"],
    # soil, harvest, tools
    43: ["crops/crop_soil_empty.png"],
    45: ["crops/crop_soil_watered.png"],
    55: ["crops/harvest_basket.png"],
    60: ["crops/seed_packet_icon.png"],
    65: ["crops/tool_watering_can.png"],
    66: ["crops/tool_hoe.png"],
}

rgba, boxes = sl.prepare(SHEET)
print(f"{len(boxes)} sprites detected")
n = 0
for idx, patterns in MAP.items():
    if idx >= len(boxes):
        print(f"  ! index {idx} out of range"); continue
    sprite = rgba.crop(boxes[idx])
    targets = []
    for pat in patterns:
        hits = glob.glob(os.path.join(GEN, pat))
        targets += [t for t in hits if t.endswith(".png")]
    for t in targets:
        rel = os.path.relpath(t, GEN)
        w, h = dims.get(rel, [sprite.width, sprite.height])
        sl.fit(sprite, w, h, False).save(t)
        n += 1
print(f"wrote {n} files")
