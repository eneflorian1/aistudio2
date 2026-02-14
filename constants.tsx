
import React from 'react';
import { Project, ProjectNotes } from './types';

export const PROJECTS: Project[] = [
  {
    id: 'de-vanzare',
    name: 'de-vanzare.ro',
    url: 'https://de-vanzare.ro',
    description: 'Platformă premium pentru anunțuri imobiliare și auto.',
    color: 'bg-blue-600',
    icon: '🏠'
  },
  {
    id: 'open-claw',
    name: 'OpenClaw',
    url: 'https://openclaw.com',
    description: 'Soluții open-source pentru automatizare și scraping.',
    color: 'bg-[#10b981]',
    icon: '🛡️'
  }
];

export const INITIAL_NOTES: ProjectNotes = {
  'de-vanzare': [
    { 
      id: 'dv-1', 
      text: 'Finalizare integrare procesator plăți', 
      createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      completed: true 
    },
    { 
      id: 'dv-2', 
      text: 'Actualizare termeni și condiții GDPR', 
      createdAt: Date.now() - 1000 * 60 * 60 * 1, // 1 hour ago
      completed: true 
    },
    { 
      id: 'dv-3', 
      text: 'Rezervare domeniu staging.de-vanzare.ro', 
      createdAt: Date.now(), 
      completed: false 
    }
  ],
  'open-claw': [
    { 
      id: 'oc-1', 
      text: 'Fix bug selectori dinamici în engine', 
      createdAt: Date.now() - 1000 * 60 * 60 * 5, 
      completed: true 
    },
    { 
      id: 'oc-2', 
      text: 'Implementare sistem rotație proxy-uri', 
      createdAt: Date.now() - 1000 * 60 * 60 * 4, 
      completed: true 
    },
    { 
      id: 'oc-3', 
      text: 'Scriere documentație pentru noii utilizatori', 
      createdAt: Date.now() - 1000 * 60 * 60 * 3, 
      completed: false 
    },
    { 
      id: 'oc-4', 
      text: 'Pregătire release v1.4.0-alpha', 
      createdAt: Date.now(), 
      completed: false 
    }
  ]
};
