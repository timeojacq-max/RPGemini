export interface Trophy {
    id: string;
    name: string;
    description: string;
    rewardDescription: string;
}

// La logique de récompense est gérée dans App.tsx
export const allTrophies: Trophy[] = [
  { id: 'first_kill', name: 'Premier Sang', description: 'Gagnez votre premier combat.', rewardDescription: '+50 XP' },
  { id: 'first_ally', name: 'Début d\'une Aventure', description: 'Recrutez votre premier compagnon.', rewardDescription: '+50 XP' },
  { id: 'two_in_one', name: 'Deux en Un !', description: 'Vaincre deux adversaires ou plus en un seul combat.', rewardDescription: '+100 XP, +50 Or' },
  { id: 'intense_combat', name: 'Combat Intense', description: 'Survivez à un combat avec moins de 10% de vos PV.', rewardDescription: '+1 ATK permanent' },
  { id: 'critical_success', name: 'Coup de Maître', description: 'Réussissez un jet de compétence avec un 20 naturel.', rewardDescription: 'Objet: Trèfle à quatre feuilles' },
  { id: 'critical_fail', name: 'Grosse Maladresse', description: 'Échouez un jet de compétence avec un 1 naturel.', rewardDescription: '+25 XP ("On apprend de ses erreurs")' },
  { id: 'found_love', name: "L'Amour Trouvé", description: 'Développez une relation amoureuse avec un PNJ.', rewardDescription: '+1 CHA permanent' },
  { id: 'true_friend', name: 'Véritable Ami', description: 'Gagnez la loyauté indéfectible d\'un PNJ compagnon.', rewardDescription: 'Objet: Charme d\'amitié' },
  { id: 'nemesis', name: 'Némésis', description: 'Faites-vous un ennemi juré qui revient vous hanter.', rewardDescription: '+100 XP' },
  { id: 'rich', name: 'Crésus', description: 'Amassez plus de 1000 pièces d\'or.', rewardDescription: '+150 XP' },
  { id: 'poor', name: 'Fauché', description: 'Tombez à 0 pièce d\'or.', rewardDescription: '+25 XP ("L\'argent ne fait pas le bonheur")' },
  { id: 'explorer', name: 'Explorateur', description: 'Découvrez 5 lieux différents sur la carte.', rewardDescription: 'Objet: Bottes de voyageur' },
  { id: 'dungeon_master', name: 'Maître des Donjons', description: 'Terminez l\'exploration d\'un donjon.', rewardDescription: '+150 XP, +100 Or' },
  { id: 'puzzle_solver', name: 'Grand Esprit', description: 'Résolvez une énigme complexe sans aide.', rewardDescription: '+1 INT permanent' },
  { id: 'pacifist', name: 'Pacifiste', description: 'Résolvez un conflit majeur sans recourir à la violence.', rewardDescription: '+1 CHA permanent, +100 XP' },
  { id: 'thief', name: 'Main Agile', description: 'Volez un objet de valeur sans vous faire prendre.', rewardDescription: 'Objet: Passe-partout' },
  { id: 'alchemist', name: 'Alchimiste en herbe', description: 'Fabriquez ou obtenez votre première potion.', rewardDescription: '+50 XP' },
  { id: 'bookworm', name: 'Rat de Bibliothèque', description: 'Lisez 3 livres ou parchemins différents.', rewardDescription: '+1 INT permanent' },
  { id: 'negotiator', name: 'Négociateur', description: 'Obtenez un meilleur prix chez un marchand.', rewardDescription: '+25 Or' },
  { id: 'survivor', name: 'Survivant', description: 'Survivez à un empoisonnement ou une maladie grave.', rewardDescription: '+1 TEC permanent' },
  { id: 'legend', name: 'Une Légende est Née', description: 'Accomplissez un acte héroïque qui marque les esprits.', rewardDescription: '+250 XP' },
  { id: 'gourmet', name: 'Gourmet', description: 'Goûtez 5 types de nourriture ou boisson différents.', rewardDescription: '+50 XP' },
  { id: 'ghost_whisperer', name: 'Murmures d\'Outre-Tombe', description: 'Communiquez avec un esprit ou un fantôme.', rewardDescription: '+1 INT permanent' },
  { id: 'dragon_slayer', name: 'Tueur de Dragon', description: 'Terrassez un dragon.', rewardDescription: 'Objet: Écaille de dragon, +500 XP' },
  { id: 'collector', name: 'Collectionneur', description: 'Possédez 10 objets uniques différents dans votre inventaire.', rewardDescription: '+1 TEC permanent' },
  { id: 'globetrotter', name: 'Globe-trotter', description: 'Visitez chaque type de lieu (Ville, Village, Donjon, Lieu d\'intérêt).', rewardDescription: 'Objet: Carte du monde enchantée' },
  { id: 'against_all_odds', name: 'Contre Vents et Marées', description: 'Gagnez un combat en étant le seul survivant face à 3 ennemis ou plus.', rewardDescription: '+1 ATK permanent, +200 XP' },
  { id: 'jack_of_all_trades', name: 'Touche-à-tout', description: 'Réussissez un jet de compétence pour chaque attribut (CHA, INT, TEC, ATK).', rewardDescription: '+1 dans tous les attributs' },
  { id: 'master_crafter', name: 'Maître Artisan', description: 'Fabriquez un objet de qualité légendaire.', rewardDescription: '+2 TEC permanents' },
  { id: 'deity_worshipper', name: 'Serviteur Divin', description: 'Obtenez la faveur d\'une divinité.', rewardDescription: 'Bénédiction divine permanente.' },
];
