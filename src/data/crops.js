(function (ns) {
  ns.CROP_DATA = {
    defaultKind: "carrot",
    growthSeconds: [10, 10, 10],
    stages: ["empty", "seed", "sprout", "medium", "mature"],
    stageAssets: {
      empty: "crops.soilEmpty",
      seed: "crops.seed",
      sprout: "crops.sprout",
      medium: "crops.medium",
      mature: "crops.matureCarrot",
    },
    kindStageAssets: {
      carrot: {
        seed: "crops.kinds.carrot.seed",
        sprout: "crops.kinds.carrot.sprout",
        medium: "crops.kinds.carrot.medium",
        mature: "crops.kinds.carrot.mature",
      },
      wheat: {
        seed: "crops.kinds.wheat.seed",
        sprout: "crops.kinds.wheat.sprout",
        medium: "crops.kinds.wheat.medium",
        mature: "crops.kinds.wheat.mature",
      },
      berries: {
        seed: "crops.kinds.berries.seed",
        sprout: "crops.kinds.berries.sprout",
        medium: "crops.kinds.berries.medium",
        mature: "crops.kinds.berries.mature",
      },
      leafy: {
        seed: "crops.kinds.leafy.seed",
        sprout: "crops.kinds.leafy.sprout",
        medium: "crops.kinds.leafy.medium",
        mature: "crops.kinds.leafy.mature",
      },
      datePalm: {
        seed: "crops.kinds.datePalm.seed",
        sprout: "crops.kinds.datePalm.sprout",
        medium: "crops.kinds.datePalm.medium",
        mature: "crops.kinds.datePalm.mature",
      },
    },
  };
})(window.MiftahGame || (window.MiftahGame = {}));
