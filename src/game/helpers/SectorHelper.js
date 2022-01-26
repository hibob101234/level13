// Singleton with helper methods for level entities
define([
	'ash',
	'game/GameGlobals',
	'game/constants/ItemConstants',
	'game/constants/PerkConstants',
	'game/constants/PositionConstants',
	'game/constants/ExplorationConstants',
	'game/nodes/sector/SectorNode',
	'game/nodes/PlayerLocationNode',
	'game/components/common/CampComponent',
	'game/components/common/PositionComponent',
	'game/components/sector/SectorStatusComponent',
	'game/components/sector/SectorFeaturesComponent',
	'game/components/sector/SectorLocalesComponent',
	'game/components/type/LevelComponent',
], function (
	Ash,
	GameGlobals,
	ItemConstants,
	PerkConstants,
	PositionConstants,
	ExplorationConstants,
	SectorNode,
	PlayerLocationNode,
	CampComponent,
	PositionComponent,
	SectorStatusComponent,
	SectorFeaturesComponent,
	SectorLocalesComponent,
	LevelComponent
) {
	var SectorHelper = Ash.Class.extend({
		
		engine: null,
		sectorNodes: null,
		playerLocationNodes: null,
		
		constructor: function (engine) {
			this.engine = engine;
			this.sectorNodes = engine.getNodeList(SectorNode);
			this.playerLocationNodes = engine.getNodeList(PlayerLocationNode);
		},
		
		getTextFeatures: function (sector) {
			var position = sector.get(PositionComponent).getPosition();
			var featuresComponent = sector.get(SectorFeaturesComponent);
			var levelOrdinal = GameGlobals.gameState.getLevelOrdinal(position.level);
			var campOrdinal = GameGlobals.gameState.getCampOrdinal(position.level);
			var levelEntity = GameGlobals.levelHelper.getLevelEntityForSector(sector);
			var levelComponent = levelEntity.get(LevelComponent);
			var hasCamp = sector.has(CampComponent);
			var hasGrove = false;
			
			var sectorLocalesComponent = sector.get(SectorLocalesComponent);
			var locales = sectorLocalesComponent.locales;
			for (let i = 0; i < locales.length; i++) {
				if (locales[i].type == localeTypes.grove) {
					hasGrove = true;
				}
			}
			
			var features = Object.assign({}, featuresComponent);
			features.level = position.level;
			features.levelOrdinal = levelOrdinal;
			features.campOrdinal = campOrdinal;
			features.condition = featuresComponent.getCondition();
			features.populationFactor = levelComponent.populationFactor;
			features.isSurfaceLevel = position.level == GameGlobals.gameState.getSurfaceLevel();
			features.isGroundLevel = position.level == GameGlobals.gameState.getGroundLevel();
			features.hasCamp = hasCamp;
			features.hasGrove = hasGrove;
			return features;
		},
		
		canExploreSector: function (sectorEntity, itemsComponent) {
			let featuresComponent = sectorEntity.get(SectorFeaturesComponent);
			var statusComponent = sectorEntity.get(SectorStatusComponent);
			return !this.isAffectedByHazard(featuresComponent, statusComponent, itemsComponent);
		},
		
		getEffectiveHazardValue: function (sectorFeatures, sectorStatus, hazard) {
			var hazards = this.getEffectiveHazards(sectorFeatures, sectorStatus);
			return hazards[hazard] || 0;
		},
		
		getEffectiveHazards: function (sectorFeatures, sectorStatus) {
			let result = sectorFeatures.hazards.clone();
			result.radiation = Math.max(0, result.radiation - sectorStatus.getHazardReduction("radiation"));
			result.poison = Math.max(0, result.poison - sectorStatus.getHazardReduction("poison"));
			result.cold = Math.max(0, result.cold - sectorStatus.getHazardReduction("cold"));
			return result;
		},
		
		hasHazards: function (sectorFeatures, sectorStatus) {
			let hazards = this.getEffectiveHazards(sectorFeatures, sectorStatus);
			return hazards.hasHazards();
		},
		
		hasSeriousHazards: function (level, sectorFeatures, sectorStatus) {
			let hazards = this.getEffectiveHazards(sectorFeatures, sectorStatus);
			let campOrdinal = GameGlobals.gameState.getCampOrdinal(level);
			let campOrdianl2 = campOrdinal - 1;
			
			if (hazards.radiation > 0 && hazards.radiation > GameGlobals.itemsHelper.getMaxHazardRadiationForLevel(campOrdianl2, 0, false)) return true;
			if (hazards.poison > 0 && hazards.poison > GameGlobals.itemsHelper.getMaxHazardPoisonForLevel(campOrdianl2, 0, false)) return true;
			if (hazards.cold > 0 && hazards.cold > GameGlobals.itemsHelper.getMaxHazardColdForLevel(campOrdianl2, 0, false)) return true;
			
			return false;
		},
			
		isAffectedByHazard: function (featuresComponent, statusComponent, itemsComponent) {
			var hazards = this.getEffectiveHazards(featuresComponent, statusComponent);
			if (hazards.hasHazards() && this.getHazardDisabledReason(featuresComponent, statusComponent, itemsComponent) !== null) {
				return true;
			}
			return false;
		},
		
		getHazardDisabledReason: function (featuresComponent, statusComponent, itemsComponent) {
			var hazards = this.getEffectiveHazards(featuresComponent, statusComponent);
			if (hazards.radiation > itemsComponent.getCurrentBonus(ItemConstants.itemBonusTypes.res_radiation))
				return "area too radioactive";
			if (hazards.poison > itemsComponent.getCurrentBonus(ItemConstants.itemBonusTypes.res_poison))
				return "area too polluted";
			if (hazards.cold > itemsComponent.getCurrentBonus(ItemConstants.itemBonusTypes.res_cold))
				return "area too cold";
			return null;
		},
		
		isBeaconActive: function (position) {
			let beacon = GameGlobals.levelHelper.getNearestBeacon(position);
			let beaconPos = beacon ? beacon.get(PositionComponent) : null;
			let dist = beaconPos ? PositionConstants.getDistanceTo(position, beaconPos) : -1;
			return dist >= 0 && dist < ExplorationConstants.BEACON_RADIUS;
		},
		
		getBeaconMovementBonus: function (sector, perksComponent) {
			let isActive = GameGlobals.sectorHelper.isBeaconActive(sector.get(PositionComponent).getPosition());
			if (!isActive) return 1;
			var perkBonus = PerkConstants.getPerk(PerkConstants.perkIds.lightBeacon).effect;
			if (perkBonus === 0) {
				perkBonus = 1;
			} else {
				perkBonus = 1 - perkBonus / 100;
			}
			return perkBonus;
		},
		
		canHaveBeacon: function (sector) {
			return GameGlobals.playerActionsHelper.isRequirementsMet("build_out_beacon", sector);
		},
		
		getLocationDiscoveredResources: function (sector) {
			var resources = [];
			sector = sector ? sector : this.playerLocationNodes.head.entity;
			var sectorStatus = sector.get(SectorStatusComponent);
			var sectorFeatures = sector.get(SectorFeaturesComponent);
			var missingResources = [];
			
			for (let i = 0; i < sectorStatus.discoveredResources.length; i++) {
				var res = sectorStatus.discoveredResources[i];
				if (sectorFeatures.resourcesScavengable[res] > 0) {
					resources.push(res);
				} else {
					log.w("Resource in discovered resources not found on sector.");
					missingResources.push(res);
				}
			}
			
			for (let j = 0; j < missingResources.length; j++) {
				sectorStatus.discoveredResources.splice(sectorStatus.discoveredResources.indexOf(missingResources[j]), 1);
			}
			
			resources.sort(function (a, b) {
				if (a === b) return 0;
				if (a === resourceNames.metal) return -1;
				if (b === resourceNames.metal) return 1;
				if (a === resourceNames.water) return -1;
				if (b === resourceNames.water) return 1;
				if (a === resourceNames.food) return -1;
				if (b === resourceNames.food) return 1;
				if (a === resourceNames.fuel) return -1;
				if (b === resourceNames.fuel) return 1;
				return 0;
			});
			
			return resources;
		},
		
		getLocationDiscoveredItems: function (sector) {
			var items = [];
			sector = sector ? sector : this.playerLocationNodes.head.entity;
			var sectorStatus = sector.get(SectorStatusComponent);
			var sectorFeatures = sector.get(SectorFeaturesComponent);
			var missingItems = [];
			
			for (let i = 0; i < sectorStatus.discoveredItems.length; i++) {
				var itemID = sectorStatus.discoveredItems[i];
				if (sectorFeatures.itemsScavengeable.indexOf(itemID) >= 0) {
					items.push(itemID);
				} else {
					log.w("Item in discovered items not found on sector.");
					missingItems.push(itemID);
				}
			}
			
			for (let j = 0; j < missingItems.length; j++) {
				sectorStatus.discoveredItems.splice(sectorStatus.discoveredItems.indexOf(missingItems[j]), 1);
			}
			
			return items;
		},
		
		getDangerFactor: function (sectorEntity) {
			if (!sectorEntity) return 1;
			let levelEntity = GameGlobals.levelHelper.getLevelEntityForSector(sectorEntity);
			let levelComponent = levelEntity.get(LevelComponent);
			let result = 1;
			if (!levelComponent.isCampable) {
				result *= 2;
			}
			return result;
		}
		
	});
	
	return SectorHelper;
});
