

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, GenerateContentResponse, Content, Type, FunctionDeclaration, FunctionCall } from "@google/genai";
import { type Message, type GenerationSettings, type GameSession, Role, Maturity, PointOfView, Tone, type InputMode, type Character, InventoryItem, ItemType, type Skill, PlayMode, Opponent, CombatAction, type SkillCheckRequest, StatusEffect, CharacterStats, CombatEffectType, type WorldState, MapLocationType, TimeOfDay, Weather, type MapLocation, type Coordinates, Quest, QuestStatus, QuestObjective, type CombatVisualEffect, type StatModifier, type Skill as SkillType, Companion, GameState } from './types';
import { allTrophies } from './trophies';
import { allStatuses } from './statuses';
import ChatPanel from './components/ChatPanel';
import InputBar from './components/InputBar';
import SettingsPanel from './components/SettingsPanel';
import HistoryPanel from './components/HistoryPanel';
import CharacterSheetPanel from './components/CharacterSheetPanel';
import AdventureCreationScreen from './components/AdventureCreationScreen';
import InventoryPanel from './components/InventoryPanel';
import DiceRoller from './components/DiceRoller';
import CombatActionModal from './components/CombatActionModal';
import CombatScreen from './components/CombatScreen';
import MapPanel from './components/MapPanel';
import TrophiesPanel from './components/TrophiesPanel';
import QuestLogPanel from './components/QuestLogPanel';
import SettingsIcon from './components/icons/SettingsIcon';
import RestartIcon from './components/icons/RestartIcon';
import HistoryIcon from './components/icons/HistoryIcon';
import UserCircleIcon from './components/icons/UserCircleIcon';
import BackpackIcon from './components/icons/BackpackIcon';
import MapIcon from './components/icons/MapIcon';
import TrophyIcon from './components/icons/TrophyIcon';
import JournalIcon from './components/icons/JournalIcon';
import TokenUsageIndicator from './components/TokenUsageIndicator';
import SwordIcon from './components/icons/SwordIcon';
import ExitIcon from './components/icons/ExitIcon';


// --- TOOLS ---
const generateSceneImageTool: FunctionDeclaration = {
    name: 'generateSceneImage',
    description: "Génère une image de la scène (lieu, personnage important).",
    parameters: {
        type: Type.OBJECT,
        properties: {
            prompt: {
                type: Type.STRING,
                description: "Prompt ANGLAIS détaillé pour l'image (scène, personnages, style)."
            },
        },
        required: ['prompt'],
    },
};

const addItemToInventoryTool: FunctionDeclaration = {
  name: 'addItemToInventory',
  description: "Ajoute des objets à l'inventaire du joueur.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        description: "Objets à ajouter.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nom de l'objet." },
            description: { type: Type.STRING, description: "Description de l'objet." },
            type: { type: Type.STRING, enum: Object.values(ItemType), description: "Type de l'objet." },
            category: { type: Type.STRING, description: "Catégorie de l'objet (ex: Potion, Arme, Quête, Divers)." },
            quantity: { type: Type.INTEGER, description: "Quantité (défaut 1)." },
          },
          required: ['name', 'description', 'type', 'category'],
        },
      },
    },
    required: ['items'],
  },
};

const removeItemFromInventoryTool: FunctionDeclaration = {
  name: 'removeItemFromInventory',
  description: "Retire des objets de l'inventaire.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      itemName: {
        type: Type.STRING,
        description: "Le nom exact de l'objet à retirer.",
      },
      quantity: {
          type: Type.INTEGER,
          description: "Quantité à retirer (défaut: tout).",
      }
    },
    required: ['itemName'],
  },
};

const addMoneyTool: FunctionDeclaration = {
  name: 'addMoney',
  description: "Ajoute de l'or au joueur.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: {
        type: Type.INTEGER,
        description: "Le montant de pièces d'or à ajouter.",
      },
    },
    required: ['amount'],
  },
};

const removeMoneyTool: FunctionDeclaration = {
  name: 'removeMoney',
  description: "Retire de l'or au joueur.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: {
        type: Type.INTEGER,
        description: "Le montant de pièces d'or à retirer.",
      },
    },
    required: ['amount'],
  },
};


const requestSkillCheckTool: FunctionDeclaration = {
  name: 'requestSkillCheck',
  description: "Demande au joueur un jet de compétence pour une action.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      skill: {
        type: Type.STRING,
        enum: ['cha', 'int', 'tec', 'atk'],
        description: "La compétence à tester (Charisme, Intelligence, Technique, Attaque).",
      },
      difficulty: {
        type: Type.INTEGER,
        description: "Difficulté à atteindre (5-20).",
      },
      reason: {
        type: Type.STRING,
        description: "Raison du jet (ex: 'Crocheter la serrure').",
      },
    },
    required: ['skill', 'difficulty', 'reason'],
  },
};


const startCombatTool: FunctionDeclaration = {
  name: 'startCombat',
  description: "Démarre un combat au tour par tour.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      opponents: {
        type: Type.ARRAY,
        description: "Adversaires dans le combat.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nom de l'adversaire (ex: 'Gobelin chétif')." },
            hp: { type: Type.INTEGER, description: "Points de vie maximum de l'adversaire." },
          },
          required: ['name', 'hp'],
        },
      },
       sceneDescription: { 
          type: Type.STRING, 
          description: "Une courte description de l'environnement du combat pour générer une image de fond."
      },
    },
    required: ['opponents', 'sceneDescription'],
  },
};
const updateHealthTool: FunctionDeclaration = {
  name: 'updateHealth',
  description: "Modifie les PV du joueur, d'un compagnon ou d'un adversaire.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      updates: {
        type: Type.ARRAY,
        description: "Liste des mises à jour de PV.",
        items: {
          type: Type.OBJECT,
          properties: {
            targetName: { type: Type.STRING, description: "Cible ('Joueur', nom du compagnon ou nom de l'adversaire)." },
            hpChange: { type: Type.INTEGER, description: "Changement PV (- pour dégâts, + pour soins)." },
          },
          required: ['targetName', 'hpChange'],
        },
      },
    },
    required: ['updates'],
  },
};

const endCombatTool: FunctionDeclaration = {
  name: 'endCombat',
  description: "Termine le combat.",
};

const applyStatusEffectTool: FunctionDeclaration = {
  name: 'applyStatusEffect',
  description: "Applique un effet de statut au joueur, à un compagnon ou à un ennemi.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetName: { type: Type.STRING, description: "Cible ('Joueur', nom du compagnon ou nom de l'adversaire)." },
      name: { type: Type.STRING, description: "Nom de l'effet (ex: 'Empoisonné', 'Béni')." },
      description: { type: Type.STRING, description: "Description de l'effet et de ses conséquences." },
    },
    required: ['targetName', 'name', 'description'],
  },
};

const removeStatusEffectTool: FunctionDeclaration = {
  name: 'removeStatusEffect',
  description: "Retire un effet de statut.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetName: { type: Type.STRING, description: "Cible ('Joueur', nom du compagnon ou nom de l'adversaire)." },
      effectName: {
        type: Type.STRING,
        description: "Le nom exact de l'effet à retirer.",
      },
    },
    required: ['targetName', 'effectName'],
  },
};

const awardXPTool: FunctionDeclaration = {
  name: 'awardXP',
  description: "Donne de l'XP au joueur.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: {
        type: Type.INTEGER,
        description: "Le nombre de points d'expérience à accorder.",
      },
      reason: {
        type: Type.STRING,
        description: "La raison pour laquelle l'XP est accordée (ex: 'Pour avoir vaincu le Gobelin').",
      },
    },
    required: ['amount', 'reason'],
  },
};

const updateMapTool: FunctionDeclaration = {
  name: 'updateMap',
  description: "Ajoute ou met à jour des lieux sur la carte. Le MJ doit créer l'ID et s'assurer qu'il est unique.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      locations: {
        type: Type.ARRAY,
        description: "Une liste de lieux à ajouter ou mettre à jour.",
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "ID unique du lieu (ex: 'village_depart_01')." },
            name: { type: Type.STRING, description: "Le nom du lieu." },
            description: { type: Type.STRING, description: "Une courte description." },
            type: { type: Type.STRING, enum: Object.values(MapLocationType), description: "Le type de lieu." },
            nearLocationId: { type: Type.STRING, description: "(Optionnel) ID du lieu existant auquel ce nouveau lieu est adjacent." },
          },
          required: ['id', 'name', 'description', 'type'],
        },
      },
    },
    required: ['locations'],
  },
};

const updatePlayerPositionTool: FunctionDeclaration = {
  name: 'updatePlayerPosition',
  description: "Met à jour la position du joueur en le déplaçant vers un lieu existant.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      locationId: { type: Type.STRING, description: "ID du lieu où se trouve maintenant le joueur." },
    },
    required: ['locationId'],
  },
};

const updateTimeAndWeatherTool: FunctionDeclaration = {
  name: 'updateTimeAndWeather',
  description: "Change l'heure et la météo.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      time: { type: Type.STRING, enum: Object.values(TimeOfDay), description: "Le nouveau moment de la journée." },
      weather: { type: Type.STRING, enum: Object.values(Weather), description: "La nouvelle météo." },
    },
    required: ['time', 'weather'],
  },
};

const unlockTrophyTool: FunctionDeclaration = {
  name: 'unlockTrophy',
  description: "Débloque un trophée pour le joueur.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      trophyId: {
        type: Type.STRING,
        description: "ID exact du trophée à débloquer.",
      },
      reason: {
        type: Type.STRING,
        description: "Raison du déblocage.",
      },
    },
    required: ['trophyId', 'reason'],
  },
};

const startQuestTool: FunctionDeclaration = {
  name: 'startQuest',
  description: "Commence une nouvelle quête pour le joueur.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      questId: { type: Type.STRING, description: "ID unique de la quête (ex: 'main_quest_01', 'side_goblin_slayer')." },
      title: { type: Type.STRING, description: "Titre de la quête." },
      description: { type: Type.STRING, description: "Description narrative de la quête." },
      objectives: {
        type: Type.ARRAY,
        description: "Liste des descriptions pour les premiers objectifs.",
        items: { type: Type.STRING }
      },
    },
    required: ['questId', 'title', 'description', 'objectives'],
  },
};

const updateQuestTool: FunctionDeclaration = {
  name: 'updateQuest',
  description: "Met à jour une quête existante.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      questId: { type: Type.STRING, description: "ID de la quête à mettre à jour." },
      objectiveToComplete: { type: Type.STRING, description: "(Optionnel) La description exacte d'un objectif à marquer comme terminé." },
      newObjective: { type: Type.STRING, description: "(Optionnel) La description d'un nouvel objectif à ajouter." },
      status: { type: Type.STRING, enum: Object.values(QuestStatus), description: "(Optionnel) Changer le statut global de la quête (Terminée, Échouée)." },
      newDescription: { type: Type.STRING, description: "(Optionnel) Mettre à jour la description de la quête." },
    },
    required: ['questId'],
  },
};

const updateCharacterStatsTool: FunctionDeclaration = {
  name: 'updateCharacterStats',
  description: "Modifie les attributs de base du joueur (CHA, INT, TEC, ATK) de façon permanente suite à un événement majeur de l'histoire (ex: entraînement intensif, bénédiction divine, séquelle permanente). Utiliser pour des changements significatifs et durables.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      updates: {
        type: Type.ARRAY,
        description: "Liste des attributs de base à modifier.",
        items: {
          type: Type.OBJECT,
          properties: {
            stat: { type: Type.STRING, enum: ['cha', 'int', 'tec', 'atk'], description: "L'attribut à modifier." },
            change: { type: Type.INTEGER, description: "La valeur à ajouter (positive) ou retirer (négative) à l'attribut de base." },
            reason: { type: Type.STRING, description: "La raison narrative de ce changement permanent." },
          },
          required: ['stat', 'change', 'reason'],
        },
      },
    },
    required: ['updates'],
  },
};

const applyStatModifierTool: FunctionDeclaration = {
  name: 'applyStatModifier',
  description: "Applique un modificateur temporaire ou conditionnel à un attribut du joueur (ex: potion de force, malédiction, équipement magique).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      stat: { type: Type.STRING, enum: ['cha', 'int', 'tec', 'atk'], description: "L'attribut affecté." },
      value: { type: Type.INTEGER, description: "Le bonus (positif) ou malus (négatif) appliqué." },
      reason: { type: Type.STRING, description: "La source du modificateur (ex: 'Potion de Force', 'Malédiction du Spectre')." },
      durationInTurns: { type: Type.INTEGER, description: "(Optionnel) La durée en tours de combat. Si omis, l'effet est considéré comme passif/continu jusqu'à sa suppression." },
    },
    required: ['stat', 'value', 'reason'],
  },
};

const removeStatModifierTool: FunctionDeclaration = {
  name: 'removeStatModifier',
  description: "Retire un modificateur de stat actif sur le joueur, par son nom (raison).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: { type: Type.STRING, description: "Le nom exact (raison) du modificateur à retirer (ex: 'Potion de Force')." },
    },
    required: ['reason'],
  },
};

const recruitCompanionTool: FunctionDeclaration = {
  name: 'recruitCompanion',
  description: "Recrute un PNJ pour qu'il rejoigne le groupe du joueur en tant que compagnon.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Nom du compagnon." },
      race: { type: Type.STRING, description: "Race du compagnon." },
      class: { type: Type.STRING, description: "Classe du compagnon." },
      background: { type: Type.STRING, description: "Courte histoire du compagnon." },
      hp: { type: Type.INTEGER, description: "Points de vie maximum du compagnon." },
      stats: {
        type: Type.OBJECT,
        description: "Attributs de base (cha, int, tec, atk).",
        properties: {
          cha: { type: Type.INTEGER },
          int: { type: Type.INTEGER },
          tec: { type: Type.INTEGER },
          atk: { type: Type.INTEGER },
        },
        required: ['cha', 'int', 'tec', 'atk'],
      },
    },
    required: ['name', 'race', 'class', 'background', 'hp', 'stats'],
  },
};

const dismissCompanionTool: FunctionDeclaration = {
  name: 'dismissCompanion',
  description: "Renvoie un compagnon du groupe du joueur.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Nom exact du compagnon à renvoyer." },
      reason: { type: Type.STRING, description: "Raison du départ du compagnon." },
    },
    required: ['name', 'reason'],
  },
};

const endGameTool: FunctionDeclaration = {
    name: 'endGame',
    description: "Met fin à la partie lorsque le joueur meurt. Fournir une description finale dramatique de la mort du joueur.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            reason: {
                type: Type.STRING,
                description: "La description narrative de la mort du joueur."
            },
        },
        required: ['reason'],
    },
};


const narrativeTools: FunctionDeclaration[] = [
    generateSceneImageTool,
    addItemToInventoryTool, 
    removeItemFromInventoryTool,
    addMoneyTool,
    removeMoneyTool,
    requestSkillCheckTool,
    startCombatTool,
    updateHealthTool,
    applyStatusEffectTool,
    removeStatusEffectTool,
    awardXPTool,
    updateMapTool,
    updatePlayerPositionTool,
    updateTimeAndWeatherTool,
    unlockTrophyTool,
    startQuestTool,
    updateQuestTool,
    updateCharacterStatsTool,
    applyStatModifierTool,
    removeStatModifierTool,
    recruitCompanionTool,
    dismissCompanionTool,
    endGameTool,
];

const combatTools: FunctionDeclaration[] = [
    updateHealthTool,
    endCombatTool,
    addItemToInventoryTool,
    removeItemFromInventoryTool,
    applyStatusEffectTool,
    removeStatusEffectTool,
    awardXPTool,
    unlockTrophyTool,
    applyStatModifierTool,
    removeStatModifierTool,
    endGameTool,
];

// --- GEMINI SERVICE ---
const createGeminiService = () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const sendMessageStream = async (history: Content[], systemInstruction: string, settings: GenerationSettings, playMode: PlayMode) => {
    const tools = playMode === 'COMBAT' ? combatTools : narrativeTools;
    return ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: history,
      config: {
          systemInstruction,
          tools: [{ functionDeclarations: tools }],
          temperature: settings.temperature,
          topP: settings.topP,
          topK: settings.topK,
      }
    });
  };
  
  const generateImage = async (prompt: string): Promise<string> => {
      const finalPrompt = `cinematic, fantasy art, detailed, epic, concept art, digital painting, ${prompt}`;
      const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: finalPrompt,
          config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '16:9',
          },
      });
      
      if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image?.imageBytes) {
        throw new Error("Image generation failed: No image data received from API.");
      }

      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
  };

  const generateFieldContent = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Tu es un assistant d'écriture pour un jeu de rôle. Tes réponses doivent être concises et directes, sans phrases introductives comme "Bien sûr, voici...". Réponds uniquement avec le contenu demandé.\n\n${prompt}`,
      config: {
        temperature: 0.8,
      }
    });
    // Remove quotes and asterisks often added by the model
    return response.text.trim().replace(/^"|"$|^\*|\*$/g, '').trim();
  };

  const generateCharacterStats = async (characterPrompt: { race: string; class: string; look: string; background: string }): Promise<CharacterStats> => {
    const STAT_POINTS_POOL = 15;
    const BASE_STAT = 8;
    const TOTAL_STATS = BASE_STAT * 4 + STAT_POINTS_POOL;

    const prompt = `Tu es un maître du jeu équilibrant un personnage. Basé sur la description suivante, attribue ses statistiques de base : Charisme (cha), Intelligence (int), Technique (tec), et Attaque (atk).
Chaque stat commence à ${BASE_STAT}. Tu as ${STAT_POINTS_POOL} points supplémentaires à répartir logiquement entre les quatre stats. Le total des quatre stats DOIT être exactement de ${TOTAL_STATS}.
Par exemple, un "Géant Guerrier stupide" devrait avoir une ATK très élevée, mais une INT et une TEC faibles. Un "Érudit fragile" aurait une INT élevée mais une ATK faible. Sois logique.

Description du personnage:
- Race: ${characterPrompt.race}
- Classe: ${characterPrompt.class}
- Apparence: ${characterPrompt.look}
- Histoire: ${characterPrompt.background}

Réponds UNIQUEMENT avec l'objet JSON contenant les stats.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cha: { type: Type.INTEGER, description: "Points de charisme" },
            int: { type: Type.INTEGER, description: "Points d'intelligence" },
            tec: { type: Type.INTEGER, description: "Points de technique" },
            atk: { type: Type.INTEGER, description: "Points d'attaque" },
          },
          required: ['cha', 'int', 'tec', 'atk'],
        },
      }
    });

    const jsonStr = response.text.trim();
    const parsedStats = JSON.parse(jsonStr) as CharacterStats;

    // Validate and normalize the stats from the model to be safe
    const statKeys = Object.keys(parsedStats) as Array<keyof CharacterStats>;
    
    let totalFromModel = 0;
    statKeys.forEach(key => {
        // Ensure no stat is below base
        if (parsedStats[key] < BASE_STAT) {
            parsedStats[key] = BASE_STAT;
        }
        totalFromModel += parsedStats[key];
    });

    if (totalFromModel !== TOTAL_STATS) {
      console.warn(`AI returned stats with incorrect total points. Expected ${TOTAL_STATS}, got ${totalFromModel}. The app will proceed with the AI's values, but this may affect game balance.`);
    }

    return parsedStats;
  };

  const summarizeHistory = async (history: Content[], character: Character, worldState: WorldState): Promise<string> => {
    const prompt = `Tu es un assistant de résumé pour un jeu de rôle. Résume l'historique suivant. Sois très concis et factuel, style télégraphique. Liste les événements clés, décisions, PNJ importants et objets obtenus.

État Actuel:
- Personnage: ${character.name}, ${character.pv} PV, ${character.money} Or.
- Compagnons: ${character.companions.map(c => `${c.name} (${c.hp} PV)`).join(', ') || 'Aucun'}.
- Monde: Lieux [${worldState.locations.map(l => l.name).join(', ') || 'Aucun'}], ${worldState.time}, ${worldState.weather}.
- Inventaire: ${character.inventory.map(i => `${i.name} (x${i.quantity})`).join(', ') || 'Vide'}.

Historique à résumer :
${JSON.stringify(history)}

Produis uniquement le résumé.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3, // Low temp for factual summary
      }
    });
    return response.text.trim();
  };

  const generateCombatActions = async (character: Character, opponents: Opponent[]): Promise<CombatAction[]> => {
    const prompt = `Tu es un game designer créant des compétences de combat pour un JDR.
Basé sur le personnage et les adversaires, génère 4 actions de combat thématiques, variées et équilibrées.
Les actions doivent inclure un mélange d'attaques, de défense (via des effets de statut comme 'Garde levée'), de soutien (soins) et d'effets de statut (affaiblissements).
Sois créatif et assure-toi que les actions correspondent au style du personnage.

Personnage:
- Nom: ${character.name}
- Race: ${character.race}
- Classe: ${character.class}
- Stats: ATK ${character.baseStats.atk}, TEC ${character.baseStats.tec}, INT ${character.baseStats.int}, CHA ${character.baseStats.cha}
- Histoire: ${character.background}

Adversaires:
${opponents.map(o => `- ${o.name} (PV: ${o.hp})`).join('\n')}

Réponds UNIQUEMENT avec un tableau JSON de 4 objets "CombatAction". N'inclus pas de texte ou d'explication en dehors du JSON.
L'ID de chaque action doit être unique, par exemple "action_combat_1", "action_combat_2", etc.
Les valeurs de "skill" doivent être l'une de: "atk", "tec", "int", "cha".
Les valeurs de "type" d'effet doivent être l'une de: "DAMAGE", "HEAL", "APPLY_STATUS", "REMOVE_STATUS".
Les valeurs de "target" d'effet doivent être l'une de: "SELF", "OPPONENT", "ALLY".
Pour "APPLY_STATUS", fournis un "statusEffect" court et descriptif (ex: "Empoisonné", "Étourdi", "Enflammé", "Béni", "En Garde").`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        skill: { type: Type.STRING, enum: ['atk', 'int', 'tec', 'cha'] },
                        effects: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: ['DAMAGE', 'HEAL', 'APPLY_STATUS', 'REMOVE_STATUS'] },
                                    target: { type: Type.STRING, enum: ['SELF', 'OPPONENT', 'ALLY'] },
                                    minValue: { type: Type.INTEGER },
                                    maxValue: { type: Type.INTEGER },
                                    statusEffect: { type: Type.STRING },
                                },
                                required: ['type', 'target', 'minValue', 'maxValue']
                            }
                        }
                    },
                    required: ['id', 'name', 'description', 'skill', 'effects']
                }
            }
        }
    });

    const jsonStr = response.text.trim();
    const parsedActions = JSON.parse(jsonStr) as CombatAction[];

    if (parsedActions.length !== 4) {
        console.warn(`AI returned ${parsedActions.length} actions instead of 4. The app will proceed but this might affect game balance.`);
    }

    return parsedActions.slice(0, 4); // Ensure we only return 4
  };
  
  const generateCompanionActions = async (companion: Omit<Companion, 'id' | 'skills' | 'hp'>): Promise<CombatAction[]> => {
    const prompt = `Tu es un game designer créant des compétences de combat pour un compagnon de JDR.
Basé sur le compagnon, génère 2-3 actions de combat thématiques et équilibrées.
Si le compagnon est un soigneur (ex: Clerc), l'une des compétences doit être de type 'HEAL' et cibler 'SELF' ou 'ALLY'.

Compagnon:
- Nom: ${companion.name}
- Race: ${companion.race}
- Classe: ${companion.class}
- Stats: ATK ${companion.stats.atk}, TEC ${companion.stats.tec}, INT ${companion.stats.int}, CHA ${companion.stats.cha}
- Histoire: ${companion.background}

Réponds UNIQUEMENT avec un tableau JSON de 2 ou 3 objets "CombatAction". N'inclus pas de texte ou d'explication en dehors du JSON.
L'ID de chaque action doit être unique, par exemple "comp_action_1", etc.
Les valeurs de "skill" doivent être l'une de: "atk", "tec", "int", "cha".
Les valeurs de "type" d'effet doivent être l'une de: "DAMAGE", "HEAL", "APPLY_STATUS", "REMOVE_STATUS".
Les valeurs de "target" d'effet doivent être l'une de: "SELF", "OPPONENT", "ALLY".`;
    
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        skill: { type: Type.STRING, enum: ['atk', 'int', 'tec', 'cha'] },
                        effects: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: ['DAMAGE', 'HEAL', 'APPLY_STATUS', 'REMOVE_STATUS'] },
                                    target: { type: Type.STRING, enum: ['SELF', 'OPPONENT', 'ALLY'] },
                                    minValue: { type: Type.INTEGER },
                                    maxValue: { type: Type.INTEGER },
                                    statusEffect: { type: Type.STRING },
                                },
                                required: ['type', 'target', 'minValue', 'maxValue']
                            }
                        }
                    },
                    required: ['id', 'name', 'description', 'skill', 'effects']
                }
            }
        }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as CombatAction[];
  }

  const countTokens = async (history: Content[]): Promise<number> => {
    try {
        const response = await ai.models.countTokens({
            model: 'gemini-2.5-flash',
            contents: history,
        });
        return response.totalTokens;
    } catch (e) {
        console.error("Token counting failed, falling back to approximation:", e);
        // Fallback to a rough estimate if API fails
        const totalChars = history
            .flatMap(c => c.parts)
            .reduce((acc, p) => {
                if ('text' in p && typeof p.text === 'string') {
                    return acc + p.text.length;
                }
                if ('functionCall' in p && p.functionCall) {
                    return acc + JSON.stringify(p.functionCall).length;
                }
                if ('functionResponse' in p && p.functionResponse) {
                    return acc + JSON.stringify(p.functionResponse).length;
                }
                return acc;
            }, 0);
        return Math.ceil(totalChars / 4);
    }
  };


  return { sendMessageStream, generateImage, generateFieldContent, summarizeHistory, generateCharacterStats, generateCombatActions, generateCompanionActions, countTokens };
};

const geminiService = createGeminiService();

// --- GAME STATE & TYPES ---
const MAX_CONTEXT_TOKENS = 1000000;
const CONTEXT_SUMMARY_TRIGGER_TOKENS = 4000;
const MESSAGES_TO_KEEP_DETAILED = 6;
const PV_BASE = 80;
const PV_PER_TEC = 4;


interface AdventureCreationResult {
    character: Character;
    prologue: string;
    tone: Tone;
    customTone: string;
    maturity: Maturity;
}

// --- UI COMPONENTS ---
const TitleScreen: React.FC<{ onNewGame: () => void, onLoadGame: () => void }> = ({ onNewGame, onLoadGame }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <h1 className="text-6xl font-medieval text-gold mb-4" style={{textShadow: '3px 3px 4px #000'}}>RPGemini</h1>
        <p className="text-text-header/80 max-w-2xl mb-8">
            Une aventure textuelle interactive où vos choix façonnent l'histoire. L'IA est votre Maître du Jeu.
        </p>
        <div className="w-full max-w-md panel-border p-8 flex flex-col gap-4">
             <button onClick={onNewGame} className="font-medieval text-xl px-8 py-4 bg-gold hover:bg-gold-dark border-2 border-amber-900 text-wood-dark rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                Nouvelle Aventure
            </button>
            <button onClick={onLoadGame} className="font-medieval text-lg px-8 py-3 bg-wood-light hover:bg-wood-light/80 border-2 border-wood-dark/50 text-text-header rounded-lg shadow-md hover:shadow-lg transition-all">
                Charger une Partie
            </button>
        </div>
    </div>
);

const GameOverScreen: React.FC<{ reason: string; onLoadLastSave: () => void; onNewAdventure: () => void }> = ({ reason, onLoadLastSave, onNewAdventure }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <h1 className="text-8xl font-medieval text-red-deep mb-4" style={{textShadow: '3px 3px 6px #000'}}>Vous êtes mort</h1>
        <p className="text-parchment max-w-2xl mb-8 italic">"{reason}"</p>
        <div className="flex flex-col sm:flex-row gap-4">
             <button onClick={onLoadLastSave} className="font-medieval text-xl px-8 py-4 bg-wood-light hover:bg-wood-light/80 border-2 border-wood-dark/50 text-text-header rounded-lg shadow-lg">
                Charger la dernière partie
            </button>
            <button onClick={onNewAdventure} className="font-medieval text-lg px-8 py-3 bg-red-deep hover:bg-red-700 border-2 border-red-900/50 text-text-header rounded-lg shadow-md">
                Nouvelle Aventure
            </button>
        </div>
    </div>
);

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' } | null>(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCharacterSheetOpen, setIsCharacterSheetOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isTrophiesOpen, setIsTrophiesOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>('SETUP');
  const [skillCheckRequest, setSkillCheckRequest] = useState<SkillCheckRequest | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [currentTokenCount, setCurrentTokenCount] = useState(0);

  // Combat State
  const [playMode, setPlayMode] = useState<PlayMode>('NARRATIVE');
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [combatActions, setCombatActions] = useState<CombatAction[]>([]);
  const [currentCharacterHp, setCurrentCharacterHp] = useState(0);
  const [combatModalState, setCombatModalState] = useState<{action: CombatAction, targetId: string | null} | null>(null);
  const [combatEffects, setCombatEffects] = useState<CombatVisualEffect[]>([]);
  const [combatBackgroundUrl, setCombatBackgroundUrl] = useState<string | null>(null);
  const [combatTurn, setCombatTurn] = useState<'PLAYER' | 'AI'>('PLAYER');
  
  // Dev mode
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  const [settings, setSettings] = useState<GenerationSettings>({ temperature: 0.7, topP: 0.95, topK: 40, maxOutputTokens: 2048 });
  const [maturity, setMaturity] = useState<Maturity>(Maturity.NORMAL);
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [pointOfView, setPointOfView] = useState<PointOfView>(PointOfView.SECOND_PERSON);
  const [tone, setTone] = useState<Tone>(Tone.NEUTRAL);
  const [customTone, setCustomTone] = useState<string>('');
  
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [worldState, setWorldState] = useState<WorldState>({ locations: [], time: TimeOfDay.DAY, weather: Weather.CLEAR });
  const [settingsActiveTab, setSettingsActiveTab] = useState<'gm' | 'engine' | 'session'>('gm');

  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('Faire');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chatHistoryRef = useRef<Content[]>([]);
  
  useEffect(() => {
    try {
        const savedSessions = localStorage.getItem('rpgemini-sessions');
        if (savedSessions) {
            setSessions(JSON.parse(savedSessions));
        }
    } catch (error) {
        console.error("Failed to load sessions from localStorage", error);
    }
  }, []);

  useEffect(() => {
    const updateTokenCount = async () => {
      if (isSandboxMode) {
        setCurrentTokenCount(1337); // Mock value for sandbox
        return;
      }
      if (chatHistoryRef.current.length > 0 && gameState === 'PLAYING') {
        const count = await geminiService.countTokens(chatHistoryRef.current);
        setCurrentTokenCount(count);
      } else {
        setCurrentTokenCount(0);
      }
    };

    const timeoutId = setTimeout(updateTokenCount, 500);
    return () => clearTimeout(timeoutId);
  }, [messages, gameState, isSandboxMode]);

  useEffect(() => {
      try {
        localStorage.setItem('rpgemini-sessions', JSON.stringify(sessions));
      } catch (error) {
        console.error("Failed to save sessions to localStorage", error);
      }
  }, [sessions]);

  // Check for player death
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    if (character && currentCharacterHp <= 0) {
      if (playMode === 'NARRATIVE') {
         // In narrative, let the AI describe the death
         programmaticSendMessage("[SYSTEM] Le joueur est mort. Décris sa fin tragique et appelle l'outil `endGame`.", true, true);
      } else {
         // In combat, death is immediate
         const reason = `${character.name} a succombé à ses blessures au combat.`;
         setGameOverReason(reason);
         setGameState('GAME_OVER');
      }
    }
  }, [currentCharacterHp, character, gameState, playMode]);

  const showNotification = (message: string, type: 'info' | 'error' = 'info', duration = 3000) => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), duration);
  };

  const getSystemInstruction = useCallback(() => {
    const companionState = character?.companions.length 
        ? `\n- Compagnons Actuels: ${character.companions.map(c => `${c.name} (${c.class}, ${c.hp}/${c.maxHp} PV)`).join(', ')}.`
        : '';

    if (playMode === 'COMBAT') {
      return `Tu es un Maître du Jeu (MJ) gérant un combat au tour par tour. Tes réponses doivent être extrêmement concises et factuelles, pour un journal de combat.
- **Rôle**: Le joueur choisit une action. Tu dois ensuite décrire les actions de chaque compagnon, puis les actions des ennemis, et enfin le résultat de l'action du joueur.
- **Flux de Combat**: Décris le tour dans cet ordre : Actions des compagnons -> Actions des ennemis -> Résultat de l'action du joueur.
- **Contrôle des Compagnons**: Fais agir les compagnons de manière intelligente et thématique par rapport à leur classe. Fais-les attaquer des ennemis ou soutenir le groupe.
- **Format**: Chaque action doit être une phrase courte. Ex: "Le Gobelin vous attaque et inflige 4 dégâts." ou "Votre Boule de Feu brûle l'Orc pour 15 dégâts.". Sépare les actions par des retours à la ligne.
- **Outils**: Utilise les outils \`updateHealth\`, \`applyStatusEffect\`, \`endCombat\` pour gérer la mécanique de TOUTES les actions (joueur, compagnons, ennemis). Si les PV du joueur atteignent 0, tu dois appeler \`endGame\`.
- **Fin de Tour**: Après avoir décrit le tour complet, termine ta réponse. N'ajoute pas de narration superflue.${companionState}`;
    }

    let instruction = `Tu es un Maître du Jeu (MJ) pour un jeu de rôle textuel. Ton but est de créer une histoire interactive et immersive.
- **Narration**: Rédige des réponses engageantes et bien écrites. Décris le monde, les PNJ et les événements de manière vivante. Adapte-toi au ton et au point de vue choisis. Fais participer activement les compagnons à l'histoire et aux dialogues.
- **Interactivité**: Réagis aux actions du joueur de manière cohérente. Pour les actions au résultat incertain, utilise l'outil \`requestSkillCheck\`.
- **Outils**: Utilise les outils fournis pour gérer l'état du jeu (inventaire, combat, carte, compagnons etc.). Utilise \`generateSceneImage\` pour illustrer les scènes importantes. Pour la carte, ne crée qu'un ou deux lieux à la fois.
- **Évolution du Personnage**: Fais évoluer les attributs du joueur en fonction de l'histoire. Utilise \`updateCharacterStats\` pour des changements permanents (entraînement, transformations) et \`applyStatModifier\` pour des effets temporaires (potions, malédictions). Assure-toi que les changements sont logiques et proportionnés. Par exemple, un géant aura naturellement une stat d'Attaque de base élevée, un érudit une stat d'Intelligence élevée.
- **Quêtes**: Gère la progression du joueur avec les outils \`startQuest\` et \`updateQuest\`. Crée des quêtes engageantes avec des objectifs clairs.
- **Mort du Joueur**: Si les actions du joueur ou l'histoire le mènent à une mort inévitable (en dehors du combat), décris la scène de manière poignante et utilise l'outil \`endGame\` pour conclure la partie.
- **Effets de Statut**: Utilise \`applyStatusEffect\` pour appliquer des conditions comme 'Empoisonné' ou 'Étourdi'. Décris leurs conséquences. Si un effet a une durée (ex: dégâts par tour pour le poison), n'oublie pas de le mentionner et d'utiliser \`updateHealth\` lors des tours suivants pour appliquer ces dégâts. Utilise \`removeStatusEffect\` quand l'effet se dissipe.`;
    
    instruction += companionState;
    if (customInstruction) instruction += `\n- Instruction Spécifique: ${customInstruction}`;
    instruction += `\n- Point de Vue: ${pointOfView}`;
    instruction += `\n- Ton: ${tone === Tone.CUSTOM ? customTone : tone}`;
    instruction += `\n- Maturité: ${maturity}`;
    return instruction;
  }, [playMode, maturity, customInstruction, pointOfView, tone, customTone, character]);

  const saveCurrentSession = useCallback(() => {
    if (!currentSessionId || !character || isSandboxMode) return;
    const sessionName = messages[0]?.content.substring(0, 40) || 'Nouvelle Aventure';

    const sessionData: GameSession = {
        id: currentSessionId,
        name: sessionName,
        timestamp: Date.now(),
        history: chatHistoryRef.current,
        messages,
        character,
        currentCharacterHp,
        worldState,
        settings, maturity, customInstruction, pointOfView, tone, customTone,
        playMode,
        opponents,
        combatBackgroundUrl,
        combatActions,
    };

    setSessions(prev => {
        const existing = prev.find(s => s.id === currentSessionId);
        if (existing) {
            return prev.map(s => s.id === currentSessionId ? sessionData : s);
        }
        return [...prev, sessionData];
    });
  }, [character, currentCharacterHp, worldState, currentSessionId, messages, settings, maturity, customInstruction, pointOfView, tone, customTone, isSandboxMode, playMode, opponents, combatBackgroundUrl, combatActions]);
  
  // FIX: Moved `programmaticSendMessage` and `checkAndSummarizeContext` before `handleAdventureCreated` to fix a "used before its declaration" error.
  const checkAndSummarizeContext = useCallback(async () => {
      if (isSummarizing || !character || !worldState) return;
  
      if (currentTokenCount > CONTEXT_SUMMARY_TRIGGER_TOKENS) {
          setIsSummarizing(true);
          showNotification("Optimisation de la mémoire de l'aventure en cours...", 'info', 5000);
  
          try {
              const history = chatHistoryRef.current;
              if (history.length < MESSAGES_TO_KEEP_DETAILED + 2) return;
  
              const initialPrompt = history[0];
              const recentHistory = history.slice(-MESSAGES_TO_KEEP_DETAILED);
              const historyToSummarize = history.slice(1, -MESSAGES_TO_KEEP_DETAILED);
              
              const existingSummaryIndex = historyToSummarize.findIndex(c => 
                  c.parts.some(p => typeof p === 'object' && 'text' in p && p.text?.startsWith('[RÉSUMÉ'))
              );
              
              let oldSummary = '';
              let startIndexForNewSummary = 0;
              if (existingSummaryIndex !== -1) {
                  const summaryPart = historyToSummarize[existingSummaryIndex].parts.find(p => typeof p === 'object' && 'text' in p && p.text?.startsWith('[RÉSUMÉ'));
                  if (summaryPart && 'text' in summaryPart) {
                     oldSummary = summaryPart.text;
                  }
                  startIndexForNewSummary = existingSummaryIndex + 1;
              }
  
              const historyForNewSummary = historyToSummarize.slice(startIndexForNewSummary);
              if (historyForNewSummary.length < 10) return;
  
              const summaryText = await geminiService.summarizeHistory(historyForNewSummary, character, worldState);
  
              const newSummaryContentText = `${oldSummary}\n\n${summaryText}`.trim();
              const summaryContent: Content = { 
                  role: 'model', 
                  parts: [{ text: newSummaryContentText }] 
              };
              
              chatHistoryRef.current = [initialPrompt, summaryContent, ...recentHistory];
              saveCurrentSession();
              showNotification("Mémoire de l'aventure optimisée avec succès !", 'info');
  
          } catch (error) {
              console.error("Failed to summarize history:", error);
              showNotification("L'optimisation de la mémoire a échoué.", 'error');
          } finally {
              setIsSummarizing(false);
          }
      }
  }, [isSummarizing, character, worldState, saveCurrentSession, currentTokenCount]);

  const programmaticSendMessage = useCallback(async (fullText: string, isSystemMessage: boolean = false, isHidden: boolean = false) => {
    if (isLoading || isSandboxMode) return;
    setIsLoading(true);
    setNotification(null);
    if (playMode !== 'COMBAT') setSkillCheckRequest(null);
    
    if (!isHidden && playMode !== 'COMBAT') {
      const userMessage: Message = { id: `msg-${Date.now()}`, role: Role.USER, content: fullText, isSystem: isSystemMessage };
      if (!isSystemMessage) setMessages(prev => [...prev, userMessage]);
    }

    if (!(isSystemMessage && isHidden)) {
      const newUserContent: Content = { role: 'user', parts: [{ text: fullText }] };
      chatHistoryRef.current.push(newUserContent);
    }
    
    if (playMode !== 'COMBAT') {
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: Role.MODEL, content: '' }]);
    }

    const processHistory = async (history: Content[], depth: number) => {
        const MAX_TOOL_RECURSION = 5;
        if (depth >= MAX_TOOL_RECURSION) {
            showNotification("L'IA semble être bloquée dans une boucle d'actions. Essayez de reformuler.", 'error');
            if (playMode !== 'COMBAT') {
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === Role.MODEL && last.content === '' && !last.imageIsLoading) {
                        return prev.slice(0, -1);
                    }
                    return prev;
                });
            }
            setIsLoading(false);
            saveCurrentSession();
            return;
        }

        let accumulatedText = '';
        const accumulatedFunctionCalls: FunctionCall[] = [];
        let hasRecursiveCall = false;

        try {
            const stream = await geminiService.sendMessageStream(history, getSystemInstruction(), settings, playMode);
            for await (const chunk of stream) {
                const text = chunk.text;
                if (text) {
                    accumulatedText += text;
                     if (playMode !== 'COMBAT') {
                        setMessages(prev => {
                            const newMessages = [...prev];
                            const lastMessage = newMessages[newMessages.length - 1];
                            if (lastMessage && lastMessage.role === Role.MODEL) {
                                newMessages[newMessages.length - 1] = { ...lastMessage, content: lastMessage.content + text };
                            }
                            return newMessages;
                        });
                    }
                }
                if (chunk.functionCalls) {
                    accumulatedFunctionCalls.push(...chunk.functionCalls);
                }
            }
            
            const lastMessageId = messages[messages.length - 1]?.id ?? '';

            const modelResponseParts: ({ text: string } | { functionCall: FunctionCall })[] = [];
            if (accumulatedText) {
                modelResponseParts.push({ text: accumulatedText });
            }
            if (accumulatedFunctionCalls.length > 0) {
                accumulatedFunctionCalls.forEach(fc => {
                    modelResponseParts.push({ functionCall: fc });
                });
            }

            if (modelResponseParts.length > 0) {
                chatHistoryRef.current.push({ role: 'model', parts: modelResponseParts });
            }

            if (accumulatedFunctionCalls.length > 0) {
                const toolResponses: Content[] = [];
                let endCombatEncountered = false;

                for (const funcCall of accumulatedFunctionCalls) {
                    let result: any = { success: true };
                    if (funcCall.name === 'generateSceneImage') {
                        const { prompt } = funcCall.args;
                        const messageIdToUpdate = lastMessageId;
                        
                        setMessages(prev => prev.map(m => m.id === messageIdToUpdate ? { ...m, imageIsLoading: true } : m));
                        
                        geminiService.generateImage(prompt)
                          .then(imageUrl => {
                            setMessages(prev => prev.map(m => m.id === messageIdToUpdate ? { ...m, imageUrl, imageIsLoading: false } : m));
                          })
                          .catch(err => {
                            console.error("Image generation failed:", err);
                            showNotification("La génération d'image a échoué.", 'error');
                            setMessages(prev => prev.map(m => m.id === messageIdToUpdate ? { ...m, imageIsLoading: false } : m));
                          });
                    
                        result = { success: true, message: "Image generation started." };
                    } else if (funcCall.name === 'startCombat') {
                        const { opponents: newOpponents, sceneDescription } = funcCall.args;
                        setPlayMode('COMBAT');
                        setCombatTurn('PLAYER');
                        setOpponents(newOpponents.map((o: any, i: number) => ({ ...o, id: `${Date.now()}-${i}`, maxHp: o.hp, statusEffects: [] })));
                        setCombatEffects([]);
                        setCombatActions([]); // Clear actions to show loading state

                        geminiService.generateImage(`dramatic fantasy combat scene, ${sceneDescription}`)
                            .then(url => setCombatBackgroundUrl(url))
                            .catch(e => {
                                console.error("Combat background image generation failed", e);
                                setCombatBackgroundUrl(null);
                            });
                        
                        if (character) {
                            try {
                                const generatedActions = await geminiService.generateCombatActions(character, newOpponents);
                                setCombatActions(generatedActions);
                            } catch (e) {
                                console.error("Failed to generate combat actions", e);
                                showNotification("Erreur lors de la génération des actions. Utilisation des compétences de base.", "error");
                                setCombatActions(character.skills.slice(0, 4));
                            }
                        }
                    } else if (funcCall.name === 'updateHealth') {
                        const { updates } = funcCall.args;
                        updates.forEach((update: { targetName: string, hpChange: number }) => {
                            let targetId = '';
                            if (update.targetName.toLowerCase() === 'joueur') {
                                targetId = 'player';
                                setCurrentCharacterHp(prev => Math.min(character?.pv ?? prev, Math.max(0, prev + update.hpChange)));
                            } else {
                                const companion = character?.companions.find(c => c.name.toLowerCase() === update.targetName.toLowerCase());
                                if (companion) {
                                    targetId = companion.id;
                                    setCharacter(c => {
                                        if (!c) return null;
                                        return { ...c, companions: c.companions.map(comp => comp.id === companion.id ? { ...comp, hp: Math.min(comp.maxHp, Math.max(0, comp.hp + update.hpChange)) } : comp) };
                                    });
                                } else {
                                    const opponent = opponents.find(o => o.name.toLowerCase() === update.targetName.toLowerCase());
                                    if (opponent) {
                                      targetId = opponent.id;
                                      setOpponents(prev => prev.map(o => o.id === opponent.id ? { ...o, hp: Math.min(o.maxHp, Math.max(0, o.hp + update.hpChange)) } : o));
                                    }
                                }
                            }

                            if (targetId) {
                                const effect: CombatVisualEffect = {
                                    id: `effect-${Date.now()}-${Math.random()}`,
                                    targetId,
                                    type: update.hpChange < 0 ? 'damage' : 'heal',
                                    content: `${update.hpChange > 0 ? '+' : ''}${update.hpChange}`
                                };
                                setCombatEffects(prev => [...prev, effect]);
                            }
                        });
                    } else if (funcCall.name === 'endCombat') {
                        setPlayMode('NARRATIVE');
                        setOpponents([]);
                        setCombatBackgroundUrl(null);
                        setCombatEffects([]);
                        endCombatEncountered = true;
                    } else if (funcCall.name === 'addItemToInventory') {
                        const { items } = funcCall.args;
                        setCharacter(c => {
                            if (!c) return null;
                            const newInventory = [...c.inventory];
                            items.forEach((itemToAdd: Omit<InventoryItem, 'quantity'> & { quantity?: number }) => {
                                const existingItem = newInventory.find(i => i.name === itemToAdd.name);
                                if (existingItem) {
                                    existingItem.quantity += (itemToAdd.quantity || 1);
                                } else {
                                    newInventory.push({ ...itemToAdd, quantity: itemToAdd.quantity || 1 });
                                }
                            });
                            return { ...c, inventory: newInventory };
                        });
                    } else if (funcCall.name === 'removeItemFromInventory') {
                        const { itemName, quantity } = funcCall.args;
                        setCharacter(prev => {
                            if (!prev) return prev;
                            const newInventory = prev.inventory.map(item => {
                                if (item.name === itemName) {
                                    const newQuantity = item.quantity - (quantity ?? item.quantity);
                                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
                                }
                                return item;
                            }).filter(Boolean) as InventoryItem[];
                            return { ...prev, inventory: newInventory };
                        });
                    } else if (funcCall.name === 'requestSkillCheck') {
                        setSkillCheckRequest({ call: funcCall, ...funcCall.args });
                    } else if (funcCall.name === 'addMoney') {
                         setCharacter(c => c ? ({ ...c, money: c.money + funcCall.args.amount }) : null);
                    } else if (funcCall.name === 'removeMoney') {
                        setCharacter(c => c ? ({ ...c, money: Math.max(0, c.money - funcCall.args.amount) }) : null);
                    } else if (funcCall.name === 'applyStatusEffect') {
                        const { targetName, name, description } = funcCall.args;
                        const newEffect = { name, description };
                        let targetId = '';
                        if (targetName.toLowerCase() === 'joueur' && character) {
                            targetId = 'player';
                             setCharacter(c => c ? ({ ...c, statusEffects: [...c.statusEffects, newEffect] }) : null);
                        } else {
                            const companion = character?.companions.find(c => c.name.toLowerCase() === targetName.toLowerCase());
                            if (companion) {
                                targetId = companion.id;
                                setCharacter(c => {
                                    if (!c) return null;
                                    return { ...c, companions: c.companions.map(comp => comp.id === companion.id ? { ...comp, statusEffects: [...comp.statusEffects, newEffect] } : comp) };
                                });
                            } else {
                                const opponent = opponents.find(o => o.name.toLowerCase() === targetName.toLowerCase());
                                if (opponent) {
                                    targetId = opponent.id;
                                    setOpponents(prev => prev.map(o => o.id === opponent.id ? { ...o, statusEffects: [...o.statusEffects, newEffect] } : o));
                                }
                            }
                        }
                         if (targetId) {
                           const combatEffect: CombatVisualEffect = {
                                id: `effect-${Date.now()}-${Math.random()}`,
                                targetId: targetId,
                                type: 'status',
                                content: name
                             };
                           setCombatEffects(prev => [...prev, combatEffect]);
                         }
                    } else if (funcCall.name === 'removeStatusEffect') {
                        const { targetName, effectName } = funcCall.args;
                        if (targetName.toLowerCase() === 'joueur' && character) {
                            setCharacter(c => c ? ({...c, statusEffects: c.statusEffects.filter(e => e.name !== effectName)}) : null);
                        } else {
                             const companion = character?.companions.find(c => c.name.toLowerCase() === targetName.toLowerCase());
                             if (companion) {
                                 setCharacter(c => {
                                     if (!c) return null;
                                     return { ...c, companions: c.companions.map(comp => comp.id === companion.id ? { ...comp, statusEffects: comp.statusEffects.filter(e => e.name !== effectName) } : comp) };
                                 });
                             } else {
                                setOpponents(prev => prev.map(o => o.name.toLowerCase() === targetName.toLowerCase() ? { ...o, statusEffects: o.statusEffects.filter(e => e.name !== effectName) } : o));
                            }
                        }
                    } else if (funcCall.name === 'awardXP') {
                        const { amount, reason } = funcCall.args;
                        handleAwardXP(amount, reason);
                    } else if (funcCall.name === 'updateMap') {
                        const { locations } = funcCall.args;
                        setWorldState(prev => {
                            const newLocations = [...prev.locations];
                            locations.forEach((newLoc: {id: string, name: string, description: string, type: MapLocationType, nearLocationId?: string}) => {
                                const existingIndex = newLocations.findIndex(l => l.id === newLoc.id);
                                
                                let position: Coordinates = { x: 50, y: 50 };

                                if (newLoc.nearLocationId) {
                                    const nearLocation = newLocations.find(l => l.id === newLoc.nearLocationId);
                                    if (nearLocation) {
                                        let attempts = 0;
                                        do {
                                            const angle = Math.random() * 2 * Math.PI;
                                            const distance = 10 + Math.random() * 15;
                                            position = {
                                                x: Math.round(Math.max(5, Math.min(95, nearLocation.position.x + Math.cos(angle) * distance))),
                                                y: Math.round(Math.max(5, Math.min(95, nearLocation.position.y + Math.sin(angle) * distance))),
                                            };
                                            attempts++;
                                            const collision = newLocations.some(l => Math.hypot(l.position.x - position.x, l.position.y - position.y) < 10);
                                            if (!collision || attempts > 20) break;
                                        } while (true);
                                    }
                                } else if (newLocations.length > 0) {
                                    let attempts = 0;
                                    do {
                                        position = {
                                            x: 10 + Math.floor(Math.random() * 81),
                                            y: 10 + Math.floor(Math.random() * 81)
                                        };
                                        attempts++;
                                        const collision = newLocations.some(l => Math.hypot(l.position.x - position.x, l.position.y - position.y) < 10);
                                        if (!collision || attempts > 20) break;
                                    } while (true);
                                }

                                const mapLocation: MapLocation = {
                                    ...newLoc,
                                    position,
                                    discovered: true,
                                };

                                if (existingIndex !== -1) {
                                    newLocations[existingIndex] = { ...newLocations[existingIndex], ...mapLocation };
                                } else {
                                    newLocations.push(mapLocation);
                                }
                            });
                            return { ...prev, locations: newLocations };
                        });
                    } else if (funcCall.name === 'updatePlayerPosition') {
                        const { locationId } = funcCall.args;
                        const location = worldState.locations.find(l => l.id === locationId);
                        if (location && character) {
                            setCharacter(c => c ? ({ ...c, position: location.position }) : null);
                        }
                    } else if (funcCall.name === 'updateTimeAndWeather') {
                        const { time, weather } = funcCall.args;
                        setWorldState(prev => ({...prev, time, weather }));
                    } else if (funcCall.name === 'unlockTrophy') {
                        const { trophyId, reason } = funcCall.args;
                        handleUnlockTrophy(trophyId, reason);
                    } else if (funcCall.name === 'startQuest') {
                        const { questId, title, description, objectives } = funcCall.args;
                        if (character) {
                            const newQuest: Quest = {
                                id: questId,
                                title,
                                description,
                                status: QuestStatus.IN_PROGRESS,
                                objectives: objectives.map((desc: string, i: number) => ({
                                    id: `${questId}-obj-${i}`,
                                    description: desc,
                                    completed: false,
                                })),
                            };
                            setCharacter(c => c ? ({...c, quests: [...c.quests, newQuest]}) : null);
                            showNotification(`Nouvelle quête: ${title}`, 'info');
                        }
                    } else if (funcCall.name === 'updateQuest') {
                        const { questId, objectiveToComplete, newObjective, status, newDescription } = funcCall.args;
                        if (character) {
                            setCharacter(c => {
                                if (!c) return null;
                                const newQuests = c.quests.map(q => {
                                    if (q.id === questId) {
                                        let updatedQuest = {...q};
                                        if (objectiveToComplete) {
                                            updatedQuest.objectives = updatedQuest.objectives.map(obj => 
                                                obj.description === objectiveToComplete ? {...obj, completed: true} : obj
                                            );
                                            showNotification(`Objectif terminé: ${objectiveToComplete}`, 'info');
                                        }
                                        if (newObjective) {
                                            const newObj: QuestObjective = {
                                                id: `${questId}-obj-${updatedQuest.objectives.length}`,
                                                description: newObjective,
                                                completed: false,
                                            };
                                            updatedQuest.objectives = [...updatedQuest.objectives, newObj];
                                            showNotification(`Nouvel objectif: ${newObjective}`, 'info');
                                        }
                                        if (newDescription) {
                                            updatedQuest.description = newDescription;
                                        }
                                        if (status) {
                                            updatedQuest.status = status;
                                            if (status === QuestStatus.COMPLETED) showNotification(`Quête terminée: ${q.title}!`, 'info');
                                            if (status === QuestStatus.FAILED) showNotification(`Quête échouée: ${q.title}.`, 'error');
                                        }
                                         // Check if all objectives are completed
                                        const allObjectivesDone = updatedQuest.objectives.every(o => o.completed);
                                        if (allObjectivesDone && updatedQuest.status === QuestStatus.IN_PROGRESS) {
                                            updatedQuest.status = QuestStatus.COMPLETED;
                                            showNotification(`Quête terminée: ${q.title}!`, 'info');
                                        }
                                        return updatedQuest;
                                    }
                                    return q;
                                });
                                return {...c, quests: newQuests};
                            });
                        }
                    } else if (funcCall.name === 'updateCharacterStats') {
                        const { updates } = funcCall.args;
                        setCharacter(c => {
                            if (!c) return null;
                            const newBaseStats = { ...c.baseStats };
                            updates.forEach((update: { stat: SkillType, change: number, reason: string }) => {
                                newBaseStats[update.stat] += update.change;
                                showNotification(`Attribut permanent changé: ${update.stat.toUpperCase()} ${update.change > 0 ? `+${update.change}` : update.change} (${update.reason})`, 'info');
                            });
                             const oldMaxPv = c.pv;
                            const newMaxPv = PV_BASE + newBaseStats.tec * PV_PER_TEC;
                            const pvDifference = newMaxPv - oldMaxPv;
                            setCurrentCharacterHp(prevHp => Math.max(0, Math.min(newMaxPv, prevHp + pvDifference)));
                            return { ...c, baseStats: newBaseStats, pv: newMaxPv };
                        });
                    } else if (funcCall.name === 'applyStatModifier') {
                        const { stat, value, reason, durationInTurns } = funcCall.args;
                        const newModifier: StatModifier = { stat, value, reason, durationInTurns };
                        setCharacter(c => c ? ({ ...c, statModifiers: [...c.statModifiers, newModifier] }) : null);
                        showNotification(`Effet appliqué: ${reason} (${stat.toUpperCase()} ${value > 0 ? `+${value}` : value})`, 'info');
                    } else if (funcCall.name === 'removeStatModifier') {
                        const { reason } = funcCall.args;
                        setCharacter(c => c ? ({ ...c, statModifiers: c.statModifiers.filter(m => m.reason !== reason) }) : null);
                        showNotification(`Effet terminé: ${reason}`, 'info');
                    } else if (funcCall.name === 'recruitCompanion') {
                        if (character) {
                            try {
                                const companionActions = await geminiService.generateCompanionActions(funcCall.args);
                                const newCompanion: Companion = {
                                    id: `comp-${Date.now()}`,
                                    ...funcCall.args,
                                    hp: funcCall.args.hp,
                                    maxHp: funcCall.args.hp,
                                    skills: companionActions,
                                    statusEffects: [],
                                };
                                setCharacter(c => c ? ({ ...c, companions: [...c.companions, newCompanion] }) : null);
                                showNotification(`${newCompanion.name} a rejoint votre groupe !`, 'info');
                                handleUnlockTrophy('first_ally', `Pour avoir recruté ${newCompanion.name}.`);
                            } catch (e) {
                                console.error("Failed to generate companion actions", e);
                                showNotification("Erreur lors du recrutement du compagnon.", "error");
                            }
                        }
                    } else if (funcCall.name === 'dismissCompanion') {
                        const { name, reason } = funcCall.args;
                         if (character) {
                            setCharacter(c => c ? ({ ...c, companions: c.companions.filter(comp => comp.name !== name) }) : null);
                            showNotification(`${name} a quitté votre groupe. (${reason})`, 'info');
                         }
                    } else if (funcCall.name === 'endGame') {
                        const { reason } = funcCall.args;
                        setGameOverReason(reason);
                        setGameState('GAME_OVER');
                    }
                    
                    toolResponses.push({
                        role: 'user',
                        parts: [{
                            functionResponse: {
                                name: funcCall.name,
                                response: { success: true, result: result }
                            }
                        }]
                    });
                }
                
                if (endCombatEncountered) {
                    programmaticSendMessage("[SYSTEM] Le combat est terminé. Décris la scène et les conséquences.", true, false);
                    return;
                }

                if (toolResponses.length > 0) {
                    hasRecursiveCall = true;
                    const historyForRecursion = [...history, { role: 'model', parts: modelResponseParts }, ...toolResponses];
                    await processHistory(historyForRecursion, depth + 1);
                }
            }

        } catch (error) {
            console.error('Error during Gemini stream processing:', error);
            const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
            showNotification(`Erreur de l'IA: ${errorMessage}`, 'error');
             if (playMode !== 'COMBAT') {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === Role.MODEL) {
                        newMessages[newMessages.length - 1] = { ...lastMessage, content: `[ERREUR] ${errorMessage}` };
                    }
                    return newMessages;
                });
            }
        } finally {
            if (!hasRecursiveCall) {
                setIsLoading(false);
                if (playMode === 'COMBAT') {
                    setCombatTurn('PLAYER');
                }
                saveCurrentSession();
                 if (playMode !== 'COMBAT') {
                    await checkAndSummarizeContext();
                 }
            }
        }
    };
    
    await processHistory(chatHistoryRef.current, 0);
  }, [isLoading, getSystemInstruction, settings, playMode, character, worldState, opponents, saveCurrentSession, checkAndSummarizeContext, messages, isSandboxMode]);

  const handleAdventureCreated = useCallback(async (data: AdventureCreationResult) => {
    setTone(data.tone);
    setCustomTone(data.customTone);
    setMaturity(data.maturity);

    const { character: newCharacter, prologue } = data;

    const newSessionId = `session-${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setCharacter(newCharacter);
    setWorldState({ locations: [], time: TimeOfDay.DAY, weather: Weather.CLEAR });
    setCurrentCharacterHp(newCharacter.pv);
    setGameState('PLAYING');
    setPlayMode('NARRATIVE');
    setOpponents([]);
    
    const initialMessage = `*${prologue}*`;
    setMessages([{ id: `msg-${Date.now()}`, role: Role.MODEL, content: initialMessage, isSystem: true }]);
    chatHistoryRef.current = [{ role: 'model', parts: [{ text: initialMessage }] }];
    
    // Auto-call Gemini to generate the starting location after character creation
    const startupPrompt = `[SYSTEM] La partie commence. Crée le premier lieu où le personnage se trouve, en utilisant l'outil updateMap. Déplace ensuite le joueur dans ce lieu avec updatePlayerPosition. Enfin, décris la scène.`;
    
    // We don't display this system message, just use it to kickstart the game
    const startupContent: Content = { role: 'user', parts: [{ text: startupPrompt }] };
    const initialHistory = [
        { role: 'model', parts: [{ text: initialMessage }] },
        startupContent
    ];
    chatHistoryRef.current = initialHistory;
    
    // Directly call the send message logic, which will save the session at the end
    await programmaticSendMessage(startupPrompt, true, true);
  }, [programmaticSendMessage]);
  
  const handleSendMessage = useCallback(async (text: string, mode: InputMode) => {
    if (isLoading || !text.trim()) return;

    if (isSandboxMode) {
        const fullText = `[${mode}] ${text}`;
        const userMessage: Message = { id: `msg-${Date.now()}`, role: Role.USER, content: fullText, isSystem: false };
        setMessages(prev => [...prev, userMessage]);
        setTimeout(() => {
            const modelResponse: Message = { id: `msg-${Date.now()+1}`, role: Role.MODEL, content: `[SANDBOX] L'IA est désactivée. Votre message était : "${text}"` };
            setMessages(prev => [...prev, modelResponse]);
        }, 500);
        setInputText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        return;
    }

    const fullText = `[${mode}] ${text}`;
    programmaticSendMessage(fullText);
    
    setInputText('');
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  }, [isLoading, programmaticSendMessage, isSandboxMode]);
  
  const handleSkillCheckComplete = (result: { roll: number; modifier: number; total: number; success: boolean }) => {
    if (!skillCheckRequest) return;
    
    const outcomeText = `Jet de ${skillCheckRequest.skill} (${skillCheckRequest.reason}): ${result.total} vs ${skillCheckRequest.difficulty}. ${result.success ? 'Succès' : 'Échec'}.`;
    
    const messageContent = `[SYSTEM] Résultat du jet: ${outcomeText}`;

    programmaticSendMessage(messageContent, true);
  };

  const handleCombatActionInitiate = (action: CombatAction, targetId: string | null) => {
    const isTargetedAction = action.effects.some(e => e.target === 'OPPONENT' || e.target === 'ALLY');
    if (isTargetedAction && !targetId) {
        showNotification("Veuillez sélectionner une cible.", 'error');
        return;
    }
    setCombatModalState({ action, targetId });
  };
  
  const handleCombatActionComplete = (action: CombatAction, targetId: string | null, result: { roll: number; modifier: number; total: number; }) => {
    setCombatModalState(null);
    setCombatTurn('AI');

    const allTargets = [...opponents, ...(character?.companions ?? [])];
    const target = allTargets.find(t => t.id === targetId);
    
    const messageContent = target
        ? `[ACTION DE COMBAT] J'utilise "${action.name}" sur "${target.name}". Résultat du jet: ${result.total}.`
        : `[ACTION DE COMBAT] J'utilise "${action.name}". Résultat du jet: ${result.total}.`;
    
    if (isSandboxMode) {
        // Simulate player action effect
        const target = opponents.find(o => o.id === targetId && o.hp > 0);
        if (target && action.effects.some(e => e.type === CombatEffectType.DAMAGE)) {
            const damageEffect = action.effects.find(e => e.type === CombatEffectType.DAMAGE)!;
            const damage = Math.floor(Math.random() * (damageEffect.maxValue - damageEffect.minValue + 1)) + damageEffect.minValue;
            setOpponents(prev => prev.map(o => o.id === target.id ? { ...o, hp: Math.max(0, o.hp - damage) } : o));
            setCombatEffects(prev => [...prev, { id: `sbox-effect-${Date.now()}`, targetId: target.id, type: 'damage', content: `-${damage}` }]);
        }
        if (action.effects.some(e => e.type === CombatEffectType.HEAL)) {
             const healEffect = action.effects.find(e => e.type === CombatEffectType.HEAL)!;
             const healing = Math.floor(Math.random() * (healEffect.maxValue - healEffect.minValue + 1)) + healEffect.minValue;
             setCurrentCharacterHp(prev => Math.min(character?.pv ?? prev, prev + healing));
             setCombatEffects(prev => [...prev, { id: `sbox-effect-${Date.now()}`, targetId: 'player', type: 'heal', content: `+${healing}` }]);
        }

        // Simulate an enemy action
        setTimeout(() => {
            const livingOpponents = opponents.filter(o => o.hp > 0);
            if (livingOpponents.length > 0) {
                const randomOpponent = livingOpponents[Math.floor(Math.random() * livingOpponents.length)];
                const damage = Math.floor(Math.random() * 8) + 3;
                setCurrentCharacterHp(prev => Math.max(0, prev - damage));
                setCombatEffects(prev => [...prev, { id: `sbox-effect-${Date.now()+1}`, targetId: 'player', type: 'damage', content: `-${damage}` }]);
            } else {
                 setCombatEffects(prev => [...prev, { id: `sbox-effect-${Date.now()+1}`, targetId: 'player', type: 'status', content: `VICTOIRE` }]);
            }
            setCombatTurn('PLAYER');
        }, 1000);
        return;
    }
    
    programmaticSendMessage(messageContent);
  };
  
  const handleAwardXP = (amount: number, reason: string) => {
    if (!character) return;
    showNotification(`+${amount} XP: ${reason}`, 'info');
    setCharacter(prevChar => {
        if (!prevChar) return null;
        let newXp = prevChar.xp + amount;
        let newLevel = prevChar.level;
        let newXpToNextLevel = prevChar.xpToNextLevel;
        let newStatPoints = prevChar.statPoints;

        while (newXp >= newXpToNextLevel) {
            newXp -= newXpToNextLevel;
            newLevel++;
            newXpToNextLevel = Math.floor(newXpToNextLevel * 1.5);
            newStatPoints += 2; // Award 2 points per level
            showNotification(`Vous êtes passé au niveau ${newLevel}!`, 'info', 5000);
        }
        return { ...prevChar, xp: newXp, level: newLevel, xpToNextLevel: newXpToNextLevel, statPoints: newStatPoints };
    });
  };
  
  const handleUnlockTrophy = (trophyId: string, reason: string) => {
    setCharacter(c => {
        if (!c || c.completedTrophies.includes(trophyId)) return c;

        const trophy = allTrophies.find(t => t.id === trophyId);
        if (trophy) {
            showNotification(`Trophée débloqué: ${trophy.name}! (${reason})`, 'info', 5000);
            
            const newBaseStats = { ...c.baseStats };
            let updated = false;
            
            // Apply reward
            switch (trophy.id) {
                case 'intense_combat':
                case 'against_all_odds':
                    newBaseStats.atk += 1; updated = true; break;
                case 'found_love':
                case 'pacifist':
                    newBaseStats.cha += 1; updated = true; break;
                case 'puzzle_solver':
                case 'bookworm':
                case 'ghost_whisperer':
                    newBaseStats.int += 1; updated = true; break;
                case 'survivor':
                case 'collector':
                    newBaseStats.tec += 1; updated = true; break;
                case 'jack_of_all_trades':
                    newBaseStats.atk += 1; newBaseStats.cha += 1; newBaseStats.int += 1; newBaseStats.tec += 1; updated = true; break;
                case 'master_crafter':
                    newBaseStats.tec += 2; updated = true; break;
            }

            if (updated) {
                const oldMaxPv = c.pv;
                const newMaxPv = PV_BASE + newBaseStats.tec * PV_PER_TEC;
                const pvDifference = newMaxPv - oldMaxPv;
                setCurrentCharacterHp(prevHp => Math.max(0, Math.min(newMaxPv, prevHp + pvDifference)));
                return { ...c, pv: newMaxPv, baseStats: newBaseStats, completedTrophies: [...c.completedTrophies, trophyId] };
            }
            
            return { ...c, completedTrophies: [...c.completedTrophies, trophyId] };
        }
        return c;
    });
  };

  const handleStatsUpdate = (newBaseStats: CharacterStats, pointsSpent: number) => {
      setCharacter(c => {
        if (!c) return null;

        const oldMaxPv = c.pv;
        const newMaxPv = PV_BASE + newBaseStats.tec * PV_PER_TEC;
        const pvDifference = newMaxPv - oldMaxPv;
        
        setCurrentCharacterHp(prevHp => Math.max(0, Math.min(newMaxPv, prevHp + pvDifference)));

        return { ...c, baseStats: newBaseStats, pv: newMaxPv, statPoints: c.statPoints - pointsSpent };
      });
      showNotification("Attributs mis à jour !", "info");
  };

  const handleUseItem = (item: InventoryItem) => {
    const messageContent = `[ACTION] J'utilise l'objet: ${item.name}.`;
    setCombatTurn('AI');

    if (isSandboxMode && playMode === 'COMBAT') {
        setIsInventoryOpen(false);
        if (item.name.toLowerCase().includes('potion')) {
            const healing = 50; // hardcoded for sandbox
            setCurrentCharacterHp(prev => Math.min(character?.pv ?? prev, prev + healing));
            setCombatEffects(prev => [...prev, { id: `sbox-effect-${Date.now()}`, targetId: 'player', type: 'heal', content: `+${healing}` }]);
        }
         // consume item
        setCharacter(prev => {
            if (!prev) return prev;
            const newInventory = prev.inventory.map(i => {
                if (i.name === item.name) {
                    const newQuantity = i.quantity - 1;
                    return newQuantity > 0 ? { ...i, quantity: newQuantity } : null;
                }
                return i;
            }).filter(Boolean) as InventoryItem[];
            return { ...prev, inventory: newInventory };
        });
        // enemy turn
        setTimeout(() => {
            const livingOpponents = opponents.filter(o => o.hp > 0);
            if (livingOpponents.length > 0) {
                const randomOpponent = livingOpponents[Math.floor(Math.random() * livingOpponents.length)];
                const damage = Math.floor(Math.random() * 8) + 3;
                setCurrentCharacterHp(prev => Math.max(0, prev - damage));
                setCombatEffects(prev => [...prev, { id: `sbox-effect-${Date.now()+1}`, targetId: 'player', type: 'damage', content: `-${damage}` }]);
            }
            setCombatTurn('PLAYER');
        }, 1000);
        return;
    }

    programmaticSendMessage(messageContent, playMode === 'COMBAT');
    setIsInventoryOpen(false);
  };
  
  const handleCombatEffectEnd = (effectId: string) => {
      setCombatEffects(prev => prev.filter(e => e.id !== effectId));
  };

  const handleDropItem = (item: InventoryItem) => {
    setCharacter(c => {
        if (!c) return null;
        const newInventory = c.inventory.filter(i => i.name !== item.name);
        return {...c, inventory: newInventory};
    });
    showNotification(`${item.name} a été jeté.`, 'info');
  };

  const handleFastTravel = (location: MapLocation) => {
    setIsMapOpen(false);
    programmaticSendMessage(`[ACTION] Voyager rapidement vers ${location.name}.`, true);
  };
  
  const handleNewGame = () => {
    setGameState('CREATING_ADVENTURE');
    setIsSettingsOpen(false);
  };
  
  const handleLoadGame = () => {
      if (sessions.length > 0) {
        setIsHistoryOpen(true);
      } else {
        showNotification("Aucune partie sauvegardée n'a été trouvée.", 'info');
      }
  };
  
  const loadSession = useCallback((sessionId: string) => {
    const sessionToLoad = sessions.find(s => s.id === sessionId);
    if (sessionToLoad) {
        setCurrentSessionId(sessionToLoad.id);
        chatHistoryRef.current = sessionToLoad.history;

        if (sessionToLoad.messages) {
            setMessages(sessionToLoad.messages);
        } else {
            // Fallback for old saves without the 'messages' array
            setMessages(sessionToLoad.history
                .filter(c => c.role === 'user' || (c.role === 'model' && c.parts.some(p => 'text' in p)))
                .map((c, i) => ({
                    id: `msg-${sessionToLoad.timestamp}-${i}`,
                    role: c.role as Role,
                    content: c.parts.map(p => 'text' in p ? p.text : '').join(''),
                    isSystem: c.parts.some(p => 'text' in p && p.text?.startsWith('[SYSTEM]')),
                }))
            );
        }

        const loadedCharacter = sessionToLoad.character;
        if (loadedCharacter) {
            setCharacter({ 
                ...loadedCharacter, 
                quests: loadedCharacter.quests || [], 
                skills: loadedCharacter.skills || [], 
                statModifiers: loadedCharacter.statModifiers || [], 
                companions: loadedCharacter.companions || [] 
            });
        } else {
            setCharacter(null);
        }
        
        setCurrentCharacterHp(sessionToLoad.currentCharacterHp ?? sessionToLoad.character?.pv ?? 0);
        setWorldState(sessionToLoad.worldState);
        setSettings({
            temperature: sessionToLoad.settings.temperature,
            topP: sessionToLoad.settings.topP,
            topK: sessionToLoad.settings.topK,
            maxOutputTokens: sessionToLoad.settings.maxOutputTokens
        });
        setMaturity(sessionToLoad.maturity);
        setCustomInstruction(sessionToLoad.customInstruction);
        setPointOfView(sessionToLoad.pointOfView);
        setTone(sessionToLoad.tone);
        setCustomTone(sessionToLoad.customTone);
        
        setPlayMode(sessionToLoad.playMode ?? 'NARRATIVE');
        setOpponents(sessionToLoad.opponents ?? []);
        setCombatBackgroundUrl(sessionToLoad.combatBackgroundUrl ?? null);
        setCombatActions(sessionToLoad.combatActions ?? []);

        setGameState('PLAYING');
        setIsHistoryOpen(false);
        showNotification(`Partie "${sessionToLoad.name}" chargée.`, 'info');
    }
  }, [sessions]);
  
  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      handleRestart(); // If deleting current session, restart
    }
  };

  const handleRestart = () => {
    setGameState('SETUP');
    setMessages([]);
    chatHistoryRef.current = [];
    setCharacter(null);
    setCurrentSessionId(null);
    setPlayMode('NARRATIVE');
    setOpponents([]);
    setCombatBackgroundUrl(null);
    setCombatEffects([]);
    setIsSandboxMode(false);
    setGameOverReason(null);
  };

  const handleGenerateImageFromChat = (messageId: string, messageContent: string) => {
    const prompt = `Génère une image pour la scène suivante: "${messageContent}"`;
    programmaticSendMessage(prompt, true);
  };

  const handleEnterSandboxMode = () => {
    const mockCharacter: Character = {
        name: 'Alex le Testeur',
        race: 'Humain',
        class: 'Guerrier',
        baseStats: { cha: 12, int: 10, tec: 14, atk: 15 },
        statModifiers: [
            { stat: 'atk', value: 5, reason: 'Potion de Force' },
            { stat: 'int', value: -2, reason: 'Malédiction de Confusion'}
        ],
        pv: 80 + 14 * 4,
        look: "Une apparence générique avec une lueur étrange dans les yeux qui semble dire 'je ne suis qu'une donnée de test'.",
        background: 'Né d\'une base de données, Alex a pour seul but de s\'assurer que l\'interface est fonctionnelle et esthétique.',
        inventory: [
            { name: 'Potion de Guérison', description: 'Restaure 50 PV.', type: ItemType.CONSUMABLE, quantity: 3, category: 'Potion' },
            { name: 'Épée en Mousse', description: 'Une arme de test.', type: ItemType.USABLE, quantity: 1, category: 'Arme' },
            { name: 'Clé de Quête Inutile', description: 'N\'ouvre aucune porte.', type: ItemType.QUEST, quantity: 1, category: 'Quête' },
        ],
        statusEffects: allStatuses.map(s => ({ name: s.name, description: s.description })),
        money: 1337,
        level: 3,
        xp: 150,
        xpToNextLevel: 450,
        statPoints: 2,
        position: { x: 50, y: 50 },
        completedTrophies: ['first_kill'],
        quests: [
            {
                id: 'q1', title: 'Tester l\'interface', status: QuestStatus.IN_PROGRESS,
                objectives: [
                    { id: 'q1o1', description: 'Ouvrir l\'inventaire', completed: true },
                    { id: 'q1o2', description: 'Vérifier la carte', completed: false },
                ],
                description: 'Une quête pour s\'assurer que tout est en ordre.'
            },
        ],
        skills: [
            { id: 'skill_basic_attack', name: 'Attaque Basique', description: 'Une simple attaque avec votre arme.', skill: 'atk', effects: [{ type: CombatEffectType.DAMAGE, target: 'OPPONENT', minValue: 5, maxValue: 10 }] },
            { id: 'skill_power_attack', name: 'Frappe Puissante', description: 'Une attaque lente mais dévastatrice.', skill: 'atk', effects: [{ type: CombatEffectType.DAMAGE, target: 'OPPONENT', minValue: 8, maxValue: 16 }] }
        ],
        companions: [
            { id: 'comp-sb-1', name: 'Grog le Fidèle', race: 'Demi-Orc', class: 'Barbare', background: 'Un compagnon de test loyal mais pas très futé.', hp: 60, maxHp: 100, stats: { cha: 8, int: 7, tec: 12, atk: 16 }, skills: [{id: 'comp-skill-1', name: 'Coup de Hache', description: 'Grog frappe fort.', skill: 'atk', effects: [{type: CombatEffectType.DAMAGE, target: 'OPPONENT', minValue: 10, maxValue: 18}]}], statusEffects: []}
        ]
    };
    const mockWorldState: WorldState = {
        locations: [
            { id: 'loc1', name: 'Point de départ', description: 'Là où tout commence.', type: MapLocationType.TOWN, position: { x: 50, y: 50 }, discovered: true },
            { id: 'loc2', name: 'Forêt des Bugs', description: 'Un lieu dangereux.', type: MapLocationType.LANDMARK, position: { x: 30, y: 40 }, discovered: true },
        ],
        time: TimeOfDay.DAY,
        weather: Weather.CLEAR,
    };
    const mockMessages: Message[] = [
        { id: 'msg-sb-1', role: Role.MODEL, content: 'Bienvenue dans le Sandbox UI. L\'IA est désactivée. Explorez l\'interface.', isSystem: true },
        { id: 'msg-sb-2', role: Role.MODEL, content: 'Ceci est un message du MJ de test. Il peut être *italique* ou **gras**.'},
        { id: 'msg-sb-3', role: Role.USER, content: '[Faire] Je teste les panneaux.' },
    ];

    setCharacter(mockCharacter);
    setCurrentCharacterHp(mockCharacter.pv);
    setWorldState(mockWorldState);
    setMessages(mockMessages);
    setGameState('PLAYING');
    setIsSandboxMode(true);
    setIsSettingsOpen(false); // Close settings panel
    showNotification('Mode Sandbox UI activé.', 'info');
};

const handleEnterSandboxCombat = () => {
    if (!isSandboxMode || !character) return;
    setPlayMode('COMBAT');
    setCombatTurn('PLAYER');
    setOpponents([
        { id: 'sb-goblin-1', name: 'Gobelin de Test', hp: 25, maxHp: 25, statusEffects: [] },
        { id: 'sb-orc-1', name: 'Orc Factice', hp: 40, maxHp: 40, statusEffects: [{ name: 'Enragé', description: 'Fait plus de dégâts.' }] },
    ]);
    setCombatActions(character.skills);
    setCombatEffects([]);
    setCombatBackgroundUrl('https://storage.googleapis.com/aistudio-project-images/656468a3-2a44-486a-8b84-3323862298c0/9d443a60-91a5-4876-9d33-f5295c553d10');
    showNotification('Simulation de combat activée.', 'info');
};

const handleExitSandboxCombat = () => {
    if (!isSandboxMode) return;
    setPlayMode('NARRATIVE');
    setOpponents([]);
    setCombatBackgroundUrl(null);
    setCombatEffects([]);
    showNotification('Simulation de combat terminée.', 'info');
};
  
  const mainPanelClasses = `h-screen w-screen flex flex-col transition-all duration-300 ease-in-out`;
  
  const renderGameState = () => {
    switch(gameState) {
      case 'SETUP':
        return <TitleScreen onNewGame={handleNewGame} onLoadGame={handleLoadGame} />;
      case 'CREATING_ADVENTURE':
        return <AdventureCreationScreen 
                    onAdventureCreated={handleAdventureCreated}
                    geminiService={{ 
                        generateFieldContent: geminiService.generateFieldContent,
                        generateCharacterStats: geminiService.generateCharacterStats 
                    }}
                    onBack={() => setGameState('SETUP')}
                />;
      case 'PLAYING':
        return (
          playMode === 'COMBAT' && character ? (
            <CombatScreen
              player={{
                id: 'player',
                name: character.name,
                currentHp: currentCharacterHp,
                maxHp: character.pv,
                statusEffects: character.statusEffects,
              }}
              companions={character.companions}
              opponents={opponents}
              actions={combatActions}
              onActionInitiate={handleCombatActionInitiate}
              onInventoryOpen={() => setIsInventoryOpen(true)}
              isLoading={isLoading}
              combatEffects={combatEffects}
              onEffectEnd={handleCombatEffectEnd}
              backgroundUrl={combatBackgroundUrl}
              combatTurn={combatTurn}
            />
          ) : (
            <>
              <ChatPanel messages={messages} isLoading={isLoading} onGenerateImage={handleGenerateImageFromChat} />
              <InputBar
                ref={textareaRef}
                text={inputText}
                onTextChange={setInputText}
                mode={inputMode}
                onModeChange={setInputMode}
                onSendMessage={() => handleSendMessage(inputText, inputMode)}
                isLoading={isLoading || !!skillCheckRequest}
              />
            </>
          )
        );
      case 'GAME_OVER':
         return ( // Render a faded out version of the last screen
             playMode === 'COMBAT' && character ? (
                <div className="opacity-30"><CombatScreen player={{ id: 'player', name: character.name, currentHp: 0, maxHp: character.pv, statusEffects: character.statusEffects }} companions={character.companions} opponents={opponents} actions={combatActions} onActionInitiate={()=>{}} onInventoryOpen={()=>{}} isLoading={false} combatEffects={[]} onEffectEnd={()=>{}} backgroundUrl={combatBackgroundUrl} combatTurn={'PLAYER'}/></div>
             ) : (
                 <div className="opacity-30"><ChatPanel messages={messages} isLoading={false} onGenerateImage={()=>{}} /></div>
             )
         );
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-wood-dark">
      {/* Side Panels */}
      <SettingsPanel
        settings={settings}
        onSettingsChange={setSettings}
        isOpen={isSettingsOpen}
        onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
        gameStarted={gameState === 'PLAYING'}
        maturity={maturity} onMaturityChange={setMaturity}
        customInstruction={customInstruction} onCustomInstructionChange={setCustomInstruction}
        pointOfView={pointOfView} onPointOfViewChange={setPointOfView}
        tone={tone} onToneChange={setTone}
        customTone={customTone} onCustomToneChange={setCustomTone}
        estimatedTokenCount={currentTokenCount}
        maxContextTokens={MAX_CONTEXT_TOKENS}
        activeTab={settingsActiveTab}
        onTabChange={setSettingsActiveTab}
        disabled={playMode === 'COMBAT'}
        onEnterSandbox={handleEnterSandboxMode}
      />
      <HistoryPanel sessions={sessions} isOpen={isHistoryOpen} onToggle={() => setIsHistoryOpen(!isHistoryOpen)} onLoadSession={loadSession} onDeleteSession={deleteSession} currentSessionId={currentSessionId} />
      {character && <CharacterSheetPanel character={character} currentHp={currentCharacterHp} isOpen={isCharacterSheetOpen} onToggle={() => setIsCharacterSheetOpen(!isCharacterSheetOpen)} onStatsUpdate={handleStatsUpdate}/>}
      {character && <InventoryPanel character={character} isOpen={isInventoryOpen} onToggle={() => setIsInventoryOpen(!isInventoryOpen)} onUseItem={handleUseItem} onDropItem={handleDropItem} />}
      {character && worldState && <MapPanel isOpen={isMapOpen} onToggle={() => setIsMapOpen(!isMapOpen)} worldState={worldState} character={character} onFastTravel={handleFastTravel}/>}
      {character && <TrophiesPanel isOpen={isTrophiesOpen} onToggle={() => setIsTrophiesOpen(!isTrophiesOpen)} allTrophies={allTrophies} completedTrophies={character.completedTrophies} />}
      {character && <QuestLogPanel isOpen={isQuestLogOpen} onToggle={() => setIsQuestLogOpen(false)} quests={character.quests} />}
      
      {/* Main Content */}
      <main className={mainPanelClasses}>
          {(gameState === 'SETUP' || gameState === 'PLAYING') && (
            <header className="flex-shrink-0 flex items-center justify-between p-2 pl-4 bg-gradient-to-b from-wood-dark via-wood-dark/90 to-transparent z-20">
              <div className="flex items-center gap-2">
                 <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-text-header rounded-full hover:bg-gold/20 hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Ouvrir les paramètres" disabled={playMode === 'COMBAT'}>
                    <SettingsIcon className="w-6 h-6" />
                 </button>
                 {gameState === 'PLAYING' && (
                   <button onClick={handleRestart} className="p-2 text-text-header rounded-full hover:bg-gold/20 hover:text-gold transition-colors" aria-label="Recommencer la partie">
                      <RestartIcon className="w-6 h-6" />
                   </button>
                 )}
              </div>
              <div className="flex items-center gap-1">
                 {gameState === 'PLAYING' && (
                   <TokenUsageIndicator tokenCount={currentTokenCount} maxTokens={MAX_CONTEXT_TOKENS} onClick={() => { setSettingsActiveTab('session'); setIsSettingsOpen(true); }} />
                 )}
                 {isSandboxMode && playMode !== 'COMBAT' && (
                    <button onClick={handleEnterSandboxCombat} className="p-2 text-text-header rounded-full hover:bg-gold/20 hover:text-gold transition-colors" aria-label="Simuler un combat" title="Simuler un combat">
                        <SwordIcon className="w-6 h-6" />
                    </button>
                 )}
                 {isSandboxMode && playMode === 'COMBAT' && (
                    <button onClick={handleExitSandboxCombat} className="p-2 text-text-header rounded-full hover:bg-gold/20 hover:text-gold transition-colors" aria-label="Quitter le combat" title="Quitter le combat">
                        <ExitIcon className="w-6 h-6" />
                    </button>
                 )}
                 <button onClick={() => setIsTrophiesOpen(true)} className="p-2 text-text-header rounded-full hover:bg-gold/20 hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Trophées" disabled={playMode === 'COMBAT' || !character}><TrophyIcon className="w-6 h-6" /></button>
                 <button onClick={() => setIsQuestLogOpen(true)} className="p-2 text-text-header rounded-full hover:bg-gold/20 hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Journal des quêtes" disabled={playMode === 'COMBAT' || !character}><JournalIcon className="w-6 h-6" /></button>
                 <button onClick={() => setIsMapOpen(true)} className="p-2 text-text-header rounded-full hover:bg-gold/20 hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Carte" disabled={playMode === 'COMBAT' || !character}><MapIcon className="w-6 h-6" /></button>
                 <button onClick={() => setIsInventoryOpen(true)} className="p-2 text-text-header rounded-full hover:bg-gold/20 hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Inventaire" disabled={!character}><BackpackIcon className="w-6 h-6" /></button>
                 <button onClick={() => setIsCharacterSheetOpen(true)} className="p-2 text-text-header rounded-full hover:bg-gold/20 hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Fiche personnage" disabled={!character}><UserCircleIcon className="w-6 h-6" /></button>
                 <button onClick={() => setIsHistoryOpen(true)} className="p-2 text-text-header rounded-full hover:bg-gold/20 hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Historique" disabled={playMode === 'COMBAT'}><HistoryIcon className="w-6 h-6" /></button>
              </div>
            </header>
          )}
          {renderGameState()}
          
          {/* Modals & Overlays */}
          {skillCheckRequest && character && playMode !== 'COMBAT' && (
              <DiceRoller request={skillCheckRequest} character={character} onComplete={handleSkillCheckComplete} />
          )}
          {combatModalState && character && (
              <CombatActionModal 
                action={combatModalState.action} 
                character={character} 
                targetId={combatModalState.targetId}
                opponents={opponents}
                companions={character.companions}
                onComplete={handleCombatActionComplete} 
                onClose={() => setCombatModalState(null)} />
          )}
          
          {gameState === 'GAME_OVER' && gameOverReason && (
              <GameOverScreen
                  reason={gameOverReason}
                  onLoadLastSave={() => {
                      const lastSession = sessions.sort((a, b) => b.timestamp - a.timestamp)[0];
                      if (lastSession) {
                          loadSession(lastSession.id);
                      }
                      handleRestart();
                  }}
                  onNewAdventure={handleRestart}
              />
          )}

          {/* Notification */}
          {notification && (
              <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl text-white font-semibold animate-fade-in z-30 ${notification.type === 'error' ? 'bg-red-deep' : 'bg-blue-deep'}`}>
                  {notification.message}
              </div>
          )}
          {(isLoading && isSummarizing) && (
              <div className="fixed bottom-5 right-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-wood-light text-text-header/80 text-sm shadow-md z-30">
                 <HistoryIcon className="w-5 h-5 animate-spin-slow"/>
                 <span>Optimisation de la mémoire...</span>
              </div>
          )}
      </main>
    </div>
  );
};

export default App;
