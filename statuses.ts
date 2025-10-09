import React from 'react';
import PoisonIcon from './components/icons/PoisonIcon';
import StunIcon from './components/icons/StunIcon';
import BleedIcon from './components/icons/BleedIcon';
import BurnIcon from './components/icons/BurnIcon';
import BlessedIcon from './components/icons/BlessedIcon';
import CursedIcon from './components/icons/CursedIcon';
import ShieldIcon from './components/icons/ShieldIcon';

export interface Status {
    id: string;
    name: string;
    description: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    color: string;
}

export const allStatuses: Status[] = [
    {
        id: 'poisoned',
        name: 'Empoisonné',
        description: 'Subit des dégâts à chaque tour.',
        icon: PoisonIcon,
        color: 'text-green-500',
    },
    {
        id: 'stunned',
        name: 'Étourdi',
        description: 'Ne peut pas agir au prochain tour.',
        icon: StunIcon,
        color: 'text-yellow-400',
    },
    {
        id: 'bleeding',
        name: 'Saignement',
        description: 'Subit des dégâts en agissant.',
        icon: BleedIcon,
        color: 'text-red-500',
    },
    {
        id: 'burning',
        name: 'Brûlure',
        description: 'Subit de lourds dégâts à chaque tour.',
        icon: BurnIcon,
        color: 'text-orange-500',
    },
    {
        id: 'blessed',
        name: 'Béni',
        description: 'Récupère des PV à chaque tour et bonus aux jets.',
        icon: BlessedIcon,
        color: 'text-sky-300',
    },
    {
        id: 'cursed',
        name: 'Maudit',
        description: 'Malus sur tous les attributs et jets.',
        icon: CursedIcon,
        color: 'text-purple-500',
    },
    {
        id: 'shielded',
        name: 'Protégé',
        description: 'Réduit les dégâts subis.',
        icon: ShieldIcon,
        color: 'text-gray-300',
    },
];
