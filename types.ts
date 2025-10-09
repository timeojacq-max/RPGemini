

import type { Content, FunctionCall } from '@google/genai';

export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  isSystem?: boolean;
  imageUrl?: string;
  imageIsLoading?: boolean;
}

export type Skill = 'cha' | 'int' | 'tec' | 'atk';

export interface GenerationSettings {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
}

export enum Maturity {
  CHILD = 'Enfant',
  NORMAL = 'Normal',
  ADULT = 'Adulte (18+)',
}

export enum PointOfView {
  SECOND_PERSON = 'Deuxième personne (Vous)',
  FIRST_PERSON = 'Première personne (Je)',
  THIRD_PERSON = 'Troisième personne (Il/Elle)',
}

export enum Tone {
  NEUTRAL = 'Neutre',
  HUMOROUS = 'Humoristique',
  DRAMATIC = 'Dramatique',
  POETIC = 'Poétique',
  CUSTOM = 'Personnalisé',
}

export enum AmbianceType {
  NONE = 'Aucun',
  FOREST = 'Forêt',
  CITY = 'Ville',
  TAVERN = 'Taverne',
  DUNGEON = 'Donjon',
  COMBAT = 'Combat',
}

export type InputMode = 'Faire' | 'Dire' | 'Histoire';

export enum ItemType {
  USABLE = 'Utilisable',      // Can be used multiple times
  CONSUMABLE = 'Consommable', // Single use, disappears after use
  QUEST = 'Quête',           // Important for the story, cannot be used directly
}

export interface InventoryItem {
  name: string;
  description: string;
  type: ItemType;
  quantity: number;
  category: string;
}

export interface CharacterStats {
  cha: number;
  int: number;
  tec: number;
  atk: number;
}

export interface StatusEffect {
  name: string;
  description: string;
}

export interface StatModifier {
  stat: Skill;
  value: number;
  reason: string;
  durationInTurns?: number;
}

export interface Coordinates {
  x: number;
  y: number;
}

export enum QuestStatus {
  IN_PROGRESS = 'En cours',
  COMPLETED = 'Terminée',
  FAILED = 'Échouée',
}

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  objectives: QuestObjective[];
}

export interface Companion {
  id: string;
  name: string;
  race: string;
  class: string;
  background: string;
  hp: number;
  maxHp: number;
  stats: CharacterStats;
  skills: CombatAction[];
  statusEffects: StatusEffect[];
}

export interface Character {
  name: string;
  race: string;
  class: string;
  baseStats: CharacterStats;
  statModifiers: StatModifier[];
  pv: number;
  look: string;
  inventory: InventoryItem[];
  background: string;
  statusEffects: StatusEffect[];
  money: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  statPoints: number;
  position: Coordinates;
  completedTrophies: string[];
  quests: Quest[];
  skills: CombatAction[];
  companions: Companion[];
}

export enum MapLocationType {
  CITY = 'Ville',
  TOWN = 'Village',
  DUNGEON = 'Donjon',
  LANDMARK = 'Lieu d\'intérêt',
  OTHER = 'Autre',
}

export interface MapLocation {
  id: string;
  name: string;
  description: string;
  type: MapLocationType;
  position: Coordinates;
  discovered: boolean;
}

export enum TimeOfDay {
  MORNING = 'Matin',
  DAY = 'Journée',
  EVENING = 'Soirée',
  NIGHT = 'Nuit',
}

export enum Weather {
  CLEAR = 'Dégagé',
  CLOUDY = 'Nuageux',
  RAINY = 'Pluvieux',
  STORMY = 'Orageux',
}

export interface WorldState {
  locations: MapLocation[];
  time: TimeOfDay;
  weather: Weather;
}


export interface GameSession {
  id: string;
  name: string;
  timestamp: number;
  history: Content[];
  messages: Message[];
  settings: GenerationSettings;
  maturity: Maturity;
  customInstruction: string;
  pointOfView: PointOfView;
  tone: Tone;
  customTone: string;
  character: Character | null;
  currentCharacterHp: number;
  worldState: WorldState;
  playMode: PlayMode;
  opponents: Opponent[];
  combatBackgroundUrl: string | null;
  combatActions: CombatAction[];
}

export interface SkillCheckRequest {
  call: FunctionCall;
  skill: Skill;
  difficulty: number;
  reason: string;
}

export type PlayMode = 'NARRATIVE' | 'COMBAT';

export enum CombatEffectType {
    DAMAGE = 'DAMAGE',
    HEAL = 'HEAL',
    APPLY_STATUS = 'APPLY_STATUS',
    REMOVE_STATUS = 'REMOVE_STATUS',
}

export type CombatTarget = 'SELF' | 'OPPONENT' | 'ALLY';

export interface CombatActionEffect {
  type: CombatEffectType;
  target: CombatTarget;
  targetName?: string; // For multi-opponent fights
  minValue: number;
  maxValue: number;
  statusEffect?: string; // Name of the status effect
}

export interface CombatAction {
  id: string;
  name: string;
  description: string;
  skill: Skill;
  effects: CombatActionEffect[];
}

export interface Opponent {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  statusEffects: StatusEffect[];
}

export type CombatVisualEffectType = 'damage' | 'heal' | 'status' | 'miss';

export interface CombatVisualEffect {
  id: string;
  targetId: string; // 'player' or opponent id or companion id
  type: CombatVisualEffectType;
  content: string; // e.g., "-10", "+15", "Poisoned"
}

export type GameState = 'SETUP' | 'CREATING_ADVENTURE' | 'PLAYING' | 'GAME_OVER';