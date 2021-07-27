define(['game/constants/CampConstants'], function (CampConstants) {
	
	var ImprovementConstants = {

		improvements: {
			home: {
				description: "Foundation of a camp.",
				useActionName: "Rest",
				improvementLevelsPerTechLevel: 0,
			},
			campfire: {
				displayNames: [ "Campfire", "Townfire", "Everfire" ],
				description: "Increases rumour generation and unlocks upgrades.",
				useActionName: "Sit down",
				improvementLevelsPerTechLevel: 5,
				improvementLevelsPerMajorLevel: 5,
				logMsgImproved: "Made the campfire a bit cozier",
			},
			house: {
				displayNames: [ "Hut", "House" ],
				description: "A place for " + CampConstants.POPULATION_PER_HOUSE + " people to stay.",
				improvementLevelsPerTechLevel: 0,
			},
			house2: {
				description: "Houses " + CampConstants.POPULATION_PER_HOUSE2 + " people.",
			},
			storage: {
				description: "Increases resource storage.",
				improvementLevelsPerTechLevel: 1,
			},
			hospital: {
				displayNames: [ "Clinic", "Hospital", "Medical Center" ],
				description: "Enables healing injuries.",
				useActionName: "Treatment",
				useActionName2: "Augment",
				improvementLevelsPerTechLevel: 1,
				improvementLevelsPerMajorLevel: 1,
			},
			market: {
				description: "Enables foreign traders to visit.",
				useActionName: "Visit",
				improvementLevelsPerTechLevel: 5,
				improvementLevelsPerMajorLevel: 5,
			},
			inn: {
				description: "Increases rumours and enables recruitment.",
				useActionName: "Recruit",
				improvementLevelsPerTechLevel: 5,
			},
			library: {
				description: "Generates evidence.",
				improvementLevelsPerTechLevel: 5,
				logMsgImproved: "Upgraded the library",
			},
			darkfarm: {
				description: "Produces food.",
				improvementLevelsPerTechLevel: 5,
			},
			aqueduct: {
				description: "Water infrastructure to improve collecting efficiency.",
				improvementLevelsPerTechLevel: 1,
			},
			temple: {
				description: "A central location for religious and cultural activities.",
				useActionName: "Donate",
				improvementLevelsPerTechLevel: 5,
			},
			shrine: {
				description: "A place to connect to the strange spirits.",
				useActionName: "Meditate",
				improvementLevelsPerTechLevel: 5,
				improvementLevelsPerMajorLevel: 5,
			},
			barracks: {
				description: "Allows 10 soldiers.",
				improvementLevelsPerTechLevel: 1,
			},
			apothecary: {
				description: "Enables production of medicine.",
				improvementLevelsPerTechLevel: 5,
			},
			smithy: {
				description: "Workspace for toolsmiths.",
				improvementLevelsPerTechLevel: 5,
			},
			cementmill: {
				description: "Enables production of a new kind of construction material.",
				improvementLevelsPerTechLevel: 5,
			},
			stable: {
				description: "Space to set up a trading caravan.",
 				improvementLevelsPerTechLevel: 1,
			},
			fortification: {
				description: "Camp defences: +" + CampConstants.FORTIFICATION_1_DEFENCE + ".",
				improvementLevelsPerTechLevel: 1,
			},
			fortification2: {
				description: "Camp defences: +" + CampConstants.FORTIFICATION_2_DEFENCE + ".",
				improvementLevelsPerTechLevel: 1,
			},
			researchcenter: {
				improvementLevelsPerTechLevel: 5,
			},
			tradepost: {
				description: "Connect camps to a trade network.",
			},
			ceiling: {},
			radiotower: {
				description: "Increases reputation.",
				improvementLevelsPerTechLevel: 5,
			},
			lights: {
				description: "Keep the darkness at bay for good.",
			},
			generator: {
				description: "Increases reputation bonus from housing (" + CampConstants.REPUTATION_PER_HOUSE_FROM_GENERATOR + "% per house).",
				improvementLevelsPerTechLevel: 10,
			},
			square: {
				description: "A place to relax and socialize.",
				improvementLevelsPerTechLevel: 1,
			},
			garden: {
				description: "A dash of beauty in the concrete desert.",
 				improvementLevelsPerTechLevel: 1,
			},
			generator: {
				logMsgImproved: "Fixed up the generator",
			},
			collector_water: {},
			collector_food: {},
			passageUpStairs: {},
			passageUpElevator: {},
			passageUpHole: {},
			passageDownStairs: {},
			passageDownElevator: {},
			passageDownHole: {},
			spaceship1: {},
			spaceship2: {},
			spaceship3: {},
		},
		
		getDef: function (improvementID) {
			let def = this.improvements[improvementID];
			if (!def) {
				let id = this.getImprovementID(improvementID);
				def = this.improvements[id];
			}
			if (!def) {
				log.w("no improvement def found: " + improvementID);
			}
			return def;
		},
		
		getMaxLevel: function (improvementID, techLevel) {
			techLevel = techLevel || 1;
			let def = this.getDef(improvementID);
			if (!def) return 1;
			
			let improvementLevelsPerTechLevel = def.improvementLevelsPerTechLevel || 0;
			
			return Math.max(1, improvementLevelsPerTechLevel * techLevel);
		},
		
		getRequiredTechLevelForLevel: function (improvementID, level) {
			let def = this.getDef(improvementID);
			if (!def) return 1;
			
			let improvementLevelsPerTechLevel = def.improvementLevelsPerTechLevel || 0;
			if (improvementLevelsPerTechLevel < 1) {
				return 1;
			}
			
			return Math.ceil(level / improvementLevelsPerTechLevel);
		},
		
		getMajorLevel: function (improvementID, level) {
			let def = this.getDef(improvementID);
			if (!def) return 1;
			
			let improvementLevelsPerMajorLevel = def.improvementLevelsPerMajorLevel || 0;
			if (improvementLevelsPerMajorLevel < 1) {
				return 1;
			}
			
			return Math.ceil(level / improvementLevelsPerMajorLevel);
		},
		
		getImprovementID: function (improvementName) {
			for (var key in improvementNames) {
				var name = improvementNames[key];
				if (name == improvementName) return key;
			}
			return null;
		},
		
		getImprovementDisplayName: function (improvementID, level) {
			level = level || 1;
			let def = this.getDef(improvementID);
			let result = improvementNames[improvementID];
			if (!def) return result;
			let names = def.displayNames;
			if (!names || names.length == 0) return result;
			let majorLevel = this.getMajorLevel(improvementID, level);
			let index = Math.min(majorLevel - 1, names.length - 1);
			return names[index];
		},
		
		getImprovementActionOrdinalForImprovementLevel: function (improvementLevel) {
			return improvementLevel - 1;
		},
		
		getImprovedLogMessage: function (improvementID, level) {
			let def = this.getDef(improvementID);
			return def && def.logMsgImproved ? def.logMsgImproved : "Improved the " + this.getImprovementDisplayName(improvementID, level);
		}

	};
	return ImprovementConstants;
});
