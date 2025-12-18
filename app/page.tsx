'use client';

import { useState, useMemo } from 'react';
import { 
  Users, BarChart3, Search, Plus, Download, Upload, 
  Filter, TrendingUp, Calendar, Award, Brain, Eye, Edit2, Trash2,
  X, Save, ChevronDown, ChevronUp, History
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { format, startOfWeek, startOfMonth, startOfYear, isWithinInterval, subWeeks, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
type UserRole = 'journaliste' | 'chef-edition' | 'admin';

type Secteur = 'politique' | 'géopolitique' | 'économie' | 'société' | 'culture' | 'sport' | 'sciences' | 'environnement' | 'tech' | 'autre';

type Statut = 'actif' | 'inactif' | 'à contacter' | 'blacklisté';

interface Passage {
  id: string;
  date: Date;
  emission: string;
  sujet: string;
  duree: number;
  notes?: string;
}

interface Guest {
  id: string;
  nom: string;
  prenom: string;
  statut: Statut;
  secteurs: Secteur[];
  organisation: string;
  fonction: string;
  bio: string;
  linkedin?: string;
  twitter?: string;
  site?: string;
  email?: string;
  telephone?: string;
  notes: string;
  passages: Passage[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

interface AuditLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

const SECTEUR_COLORS: Record<Secteur, string> = {
  politique: '#ef4444',
  géopolitique: '#f59e0b',
  économie: '#10b981',
  société: '#3b82f6',
  culture: '#8b5cf6',
  sport: '#ec4899',
  sciences: '#06b6d4',
  environnement: '#84cc16',
  tech: '#6366f1',
  autre: '#6b7280',
};

const SECTEUR_LABELS: Record<Secteur, string> = {
  politique: 'Politique',
  géopolitique: 'Géopolitique',
  économie: 'Économie',
  société: 'Société',
  culture: 'Culture',
  sport: 'Sport',
  sciences: 'Sciences',
  environnement: 'Environnement',
  tech: 'Technologies',
  autre: 'Autre',
};

// Initial mock data
const initialGuests: Guest[] = [
  {
    id: '1',
    nom: 'Dupont',
    prenom: 'Marie',
    statut: 'actif',
    secteurs: ['politique', 'société'],
    organisation: 'Institut Politique Paris',
    fonction: 'Directrice de Recherche',
    bio: 'Spécialiste des politiques publiques avec 15 ans d\'expérience en analyse politique.',
    linkedin: 'https://linkedin.com/in/mariedupont',
    twitter: '@mariedupont',
    email: 'marie.dupont@ipp.fr',
    telephone: '01 23 45 67 89',
    notes: 'Excellente oratrice, disponible le matin',
    passages: [
      { id: 'p1', date: new Date('2024-11-15'), emission: 'Le Grand Matin', sujet: 'Réforme des retraites', duree: 15, notes: 'Très bon passage' },
      { id: 'p2', date: new Date('2024-10-20'), emission: 'Le Débat', sujet: 'Élections européennes', duree: 30 },
      { id: 'p3', date: new Date('2024-09-10'), emission: 'Le Grand Matin', sujet: 'Budget 2025', duree: 20 },
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-11-15'),
    createdBy: 'admin@radio.fr',
    lastModifiedBy: 'journaliste@radio.fr',
  },
  {
    id: '2',
    nom: 'Martin',
    prenom: 'Jacques',
    statut: 'actif',
    secteurs: ['économie', 'tech'],
    organisation: 'Banque Centrale',
    fonction: 'Économiste en Chef',
    bio: 'Expert en économie numérique et politiques monétaires.',
    linkedin: 'https://linkedin.com/in/jacquesmartin',
    email: 'j.martin@bc.fr',
    notes: 'Préfère les interviews en fin de journée',
    passages: [
      { id: 'p4', date: new Date('2024-11-25'), emission: 'Économie Matin', sujet: 'Inflation et taux d\'intérêt', duree: 25 },
      { id: 'p5', date: new Date('2024-11-10'), emission: 'Le Grand Matin', sujet: 'Crypto-monnaies', duree: 15 },
    ],
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-11-25'),
    createdBy: 'admin@radio.fr',
    lastModifiedBy: 'chef@radio.fr',
  },
  {
    id: '3',
    nom: 'Bernard',
    prenom: 'Sophie',
    statut: 'actif',
    secteurs: ['culture', 'société'],
    organisation: 'Musée des Arts',
    fonction: 'Conservatrice',
    bio: 'Historienne de l\'art spécialisée dans l\'art contemporain.',
    email: 's.bernard@musee.fr',
    site: 'https://sophiebernard.fr',
    notes: 'Très pédagogue, excellente pour vulgariser',
    passages: [
      { id: 'p6', date: new Date('2024-12-01'), emission: 'Culture Midi', sujet: 'Exposition Picasso', duree: 20 },
    ],
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-12-01'),
    createdBy: 'journaliste@radio.fr',
    lastModifiedBy: 'journaliste@radio.fr',
  },
  {
    id: '4',
    nom: 'Rousseau',
    prenom: 'Pierre',
    statut: 'actif',
    secteurs: ['géopolitique'],
    organisation: 'Think Tank International',
    fonction: 'Analyste Senior',
    bio: 'Spécialiste du Moyen-Orient et des relations internationales.',
    linkedin: 'https://linkedin.com/in/pierrerousseau',
    telephone: '01 98 76 54 32',
    notes: 'Contacts excellents, réactif pour l\'actualité',
    passages: [
      { id: 'p7', date: new Date('2024-11-28'), emission: 'Le Débat', sujet: 'Conflit au Moyen-Orient', duree: 35 },
      { id: 'p8', date: new Date('2024-10-15'), emission: 'Le Grand Matin', sujet: 'Sommet G20', duree: 15 },
    ],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-11-28'),
    createdBy: 'admin@radio.fr',
    lastModifiedBy: 'chef@radio.fr',
  },
  {
    id: '5',
    nom: 'Lefebvre',
    prenom: 'Thomas',
    statut: 'actif',
    secteurs: ['sport'],
    organisation: 'Fédération Française de Football',
    fonction: 'Consultant Sport',
    bio: 'Ancien joueur professionnel, consultant sportif.',
    twitter: '@thomaslefebvre',
    notes: 'Agenda très chargé, réserver 2 semaines à l\'avance',
    passages: [
      { id: 'p9', date: new Date('2024-12-05'), emission: 'Sport Soir', sujet: 'Coupe du Monde', duree: 20 },
    ],
    createdAt: new Date('2024-04-12'),
    updatedAt: new Date('2024-12-05'),
    createdBy: 'journaliste@radio.fr',
    lastModifiedBy: 'journaliste@radio.fr',
  },
];

export default function Home() {
  const [currentUser] = useState<{ email: string; role: UserRole; name: string }>({
    email: 'journaliste@radio.fr',
    role: 'admin',
    name: 'Admin User',
  });

  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'guests' | 'dashboard' | 'ai' | 'audit'>('guests');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<Statut | 'tous'>('tous');
  const [filterSecteur, setFilterSecteur] = useState<Secteur | 'tous'>('tous');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Guest>>({});

  // AI Module State
  const [aiSubject, setAiSubject] = useState('');
  const [aiSecteur, setAiSecteur] = useState<Secteur | ''>('');
  const [aiFormat, setAiFormat] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<Guest[]>([]);
  const [aiSearchKeywords, setAiSearchKeywords] = useState('');

  // Import State
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Add audit log
  const addAuditLog = (action: string, entityType: string, entityId: string, details: string) => {
    const log: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      user: currentUser.email,
      action,
      entityType,
      entityId,
      details,
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Filtered guests
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = searchTerm === '' || 
        guest.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.organisation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.fonction.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatut = filterStatut === 'tous' || guest.statut === filterStatut;
      const matchesSecteur = filterSecteur === 'tous' || guest.secteurs.includes(filterSecteur);
      
      return matchesSearch && matchesStatut && matchesSecteur;
    });
  }, [guests, searchTerm, filterStatut, filterSecteur]);

  // Statistics calculations
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: fr });
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    const allPassages = guests.flatMap(g => g.passages.map(p => ({ ...p, guest: g })));

    const passagesThisWeek = allPassages.filter(p => p.date >= weekStart);
    const passagesThisMonth = allPassages.filter(p => p.date >= monthStart);
    const passagesThisYear = allPassages.filter(p => p.date >= yearStart);

    // Passages par secteur
    const passagesBySecteur: Record<string, number> = {};
    allPassages.forEach(p => {
      p.guest.secteurs.forEach(s => {
        passagesBySecteur[s] = (passagesBySecteur[s] || 0) + 1;
      });
    });

    // Évolution mensuelle (6 derniers mois)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStartDate = startOfMonth(monthDate);
      const monthEndDate = startOfMonth(subMonths(now, i - 1));
      const count = allPassages.filter(p => 
        p.date >= monthStartDate && p.date < monthEndDate
      ).length;
      monthlyData.push({
        month: format(monthDate, 'MMM yyyy', { locale: fr }),
        passages: count,
      });
    }

    // Top invités
    const guestPassageCount = guests.map(g => ({
      name: `${g.prenom} ${g.nom}`,
      passages: g.passages.length,
      secteurs: g.secteurs,
    })).sort((a, b) => b.passages - a.passages).slice(0, 10);

    return {
      total: guests.length,
      actifs: guests.filter(g => g.statut === 'actif').length,
      passagesWeek: passagesThisWeek.length,
      passagesMonth: passagesThisMonth.length,
      passagesYear: passagesThisYear.length,
      passagesBySecteur: Object.entries(passagesBySecteur).map(([secteur, count]) => ({
        secteur: SECTEUR_LABELS[secteur as Secteur] || secteur,
        count,
        color: SECTEUR_COLORS[secteur as Secteur] || '#6b7280',
      })),
      monthlyData,
      topGuests: guestPassageCount,
    };
  }, [guests]);

  // Handle guest operations
  const handleSaveGuest = () => {
    if (!editForm.nom || !editForm.prenom) {
      alert('Le nom et prénom sont obligatoires');
      return;
    }

    if (isEditing && selectedGuest) {
      const updated = guests.map(g => 
        g.id === selectedGuest.id 
          ? { ...g, ...editForm, updatedAt: new Date(), lastModifiedBy: currentUser.email }
          : g
      );
      setGuests(updated);
      addAuditLog('Modification', 'Invité', selectedGuest.id, `${editForm.prenom} ${editForm.nom} modifié`);
      setSelectedGuest(null);
      setIsEditing(false);
    } else if (showAddGuest) {
      const newGuest: Guest = {
        id: Date.now().toString(),
        nom: editForm.nom!,
        prenom: editForm.prenom!,
        statut: editForm.statut || 'actif',
        secteurs: editForm.secteurs || [],
        organisation: editForm.organisation || '',
        fonction: editForm.fonction || '',
        bio: editForm.bio || '',
        linkedin: editForm.linkedin,
        twitter: editForm.twitter,
        site: editForm.site,
        email: editForm.email,
        telephone: editForm.telephone,
        notes: editForm.notes || '',
        passages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser.email,
        lastModifiedBy: currentUser.email,
      };
      setGuests([...guests, newGuest]);
      addAuditLog('Création', 'Invité', newGuest.id, `${newGuest.prenom} ${newGuest.nom} créé`);
      setShowAddGuest(false);
    }
    setEditForm({});
  };

  const handleDeleteGuest = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet invité ?')) {
      const guest = guests.find(g => g.id === id);
      setGuests(guests.filter(g => g.id !== id));
      if (guest) {
        addAuditLog('Suppression', 'Invité', id, `${guest.prenom} ${guest.nom} supprimé`);
      }
      setSelectedGuest(null);
    }
  };

  // AI Recommendations
  const handleAIRecommendation = () => {
    const recommendations = guests.filter(guest => {
      const matchesSecteur = !aiSecteur || guest.secteurs.includes(aiSecteur);
      const matchesSubject = !aiSubject || 
        guest.bio.toLowerCase().includes(aiSubject.toLowerCase()) ||
        guest.secteurs.some(s => SECTEUR_LABELS[s].toLowerCase().includes(aiSubject.toLowerCase()));
      return matchesSecteur && matchesSubject && guest.statut === 'actif';
    }).sort((a, b) => b.passages.length - a.passages.length).slice(0, 5);

    setAiRecommendations(recommendations);
  };

  const handleGenerateKeywords = () => {
    const keywords = [];
    if (aiSubject) keywords.push(aiSubject);
    if (aiSecteur) keywords.push(SECTEUR_LABELS[aiSecteur]);
    if (aiFormat) keywords.push(aiFormat);
    keywords.push('expert', 'spécialiste', 'analyste', 'consultant');
    setAiSearchKeywords(keywords.join(' + '));
  };

  // Import Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setImportData(data);
      
      // Auto-detect columns
      if (data.length > 0) {
        const firstRow = data[0] as any;
        const mapping: Record<string, string> = {};
        Object.keys(firstRow).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('nom')) mapping['nom'] = key;
          if (lowerKey.includes('prenom') || lowerKey.includes('prénom')) mapping['prenom'] = key;
          if (lowerKey.includes('email') || lowerKey.includes('mail')) mapping['email'] = key;
          if (lowerKey.includes('organisation') || lowerKey.includes('entreprise')) mapping['organisation'] = key;
          if (lowerKey.includes('fonction') || lowerKey.includes('poste')) mapping['fonction'] = key;
        });
        setColumnMapping(mapping);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportData = () => {
    const imported: Guest[] = [];
    const errors: string[] = [];

    importData.forEach((row: any, index) => {
      const nom = row[columnMapping['nom']];
      const prenom = row[columnMapping['prenom']];

      if (!nom || !prenom) {
        errors.push(`Ligne ${index + 1}: nom ou prénom manquant`);
        return;
      }

      // Check duplicates
      const exists = guests.some(g => 
        g.nom.toLowerCase() === nom.toLowerCase() && 
        g.prenom.toLowerCase() === prenom.toLowerCase()
      );
      
      if (exists) {
        errors.push(`Ligne ${index + 1}: ${prenom} ${nom} existe déjà`);
        return;
      }

      const newGuest: Guest = {
        id: Date.now().toString() + index,
        nom,
        prenom,
        statut: 'à contacter',
        secteurs: [],
        organisation: row[columnMapping['organisation']] || '',
        fonction: row[columnMapping['fonction']] || '',
        bio: row[columnMapping['bio']] || '',
        email: row[columnMapping['email']],
        linkedin: row[columnMapping['linkedin']],
        telephone: row[columnMapping['telephone']],
        notes: '',
        passages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser.email,
        lastModifiedBy: currentUser.email,
      };
      imported.push(newGuest);
    });

    if (errors.length > 0) {
      alert(`Erreurs détectées:\n${errors.join('\n')}`);
    }

    if (imported.length > 0) {
      setGuests([...guests, ...imported]);
      addAuditLog('Import', 'Invités', 'bulk', `${imported.length} invité(s) importé(s)`);
      setShowImport(false);
      setImportData([]);
      alert(`${imported.length} invité(s) importé(s) avec succès`);
    }
  };

  // Export
  const handleExport = (exportFormat: 'csv' | 'xlsx') => {
    const exportData = filteredGuests.map(g => ({
      Nom: g.nom,
      Prénom: g.prenom,
      Statut: g.statut,
      Secteurs: g.secteurs.map(s => SECTEUR_LABELS[s]).join(', '),
      Organisation: g.organisation,
      Fonction: g.fonction,
      Email: g.email || '',
      Téléphone: g.telephone || '',
      LinkedIn: g.linkedin || '',
      'Nombre de passages': g.passages.length,
      'Dernier passage': g.passages.length > 0 ? format(new Date(Math.max(...g.passages.map(p => p.date.getTime()))), 'dd/MM/yyyy') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invités');

    if (exportFormat === 'xlsx') {
      XLSX.writeFile(wb, `invites_radio_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } else {
      XLSX.writeFile(wb, `invites_radio_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion d'Invités Radio</h1>
                <p className="text-sm text-gray-600">Système de gestion et d'analyse</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-600 capitalize">{currentUser.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('guests')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'guests'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Invités
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'ai'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-2" />
              Assistant IA
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'audit'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              Audit
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guests Tab */}
        {activeTab === 'guests' && (
          <div className="space-y-6">
            {/* Search and Actions */}
            <div className="card">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, organisation, fonction..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtres
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setShowAddGuest(true);
                    setEditForm({
                      statut: 'actif',
                      secteurs: [],
                      notes: '',
                    });
                  }}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nouvel invité
                </button>
                <button
                  onClick={() => setShowImport(true)}
                  className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Excel
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="btn btn-secondary flex items-center gap-2"
                    title="Export Excel"
                  >
                    <Download className="w-4 h-4" />
                    XLSX
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="btn btn-secondary flex items-center gap-2"
                    title="Export CSV"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select
                      value={filterStatut}
                      onChange={(e) => setFilterStatut(e.target.value as Statut | 'tous')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="tous">Tous les statuts</option>
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                      <option value="à contacter">À contacter</option>
                      <option value="blacklisté">Blacklisté</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
                    <select
                      value={filterSecteur}
                      onChange={(e) => setFilterSecteur(e.target.value as Secteur | 'tous')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="tous">Tous les secteurs</option>
                      {Object.entries(SECTEUR_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 text-sm">Total invités</p>
                    <p className="text-3xl font-bold mt-2">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-green-100 text-sm">Invités actifs</p>
                    <p className="text-3xl font-bold mt-2">{stats.actifs}</p>
                  </div>
                  <Award className="w-8 h-8 text-green-200" />
                </div>
              </div>
              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-purple-100 text-sm">Passages ce mois</p>
                    <p className="text-3xl font-bold mt-2">{stats.passagesMonth}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-200" />
                </div>
              </div>
              <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-orange-100 text-sm">Passages cette année</p>
                    <p className="text-3xl font-bold mt-2">{stats.passagesYear}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Guests List */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Liste des invités ({filteredGuests.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Organisation</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Secteurs</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Passages</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredGuests.map((guest) => (
                      <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{guest.prenom} {guest.nom}</div>
                          <div className="text-sm text-gray-600">{guest.fonction}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{guest.organisation}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {guest.secteurs.slice(0, 2).map(s => (
                              <span
                                key={s}
                                className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                style={{ backgroundColor: SECTEUR_COLORS[s] }}
                              >
                                {SECTEUR_LABELS[s]}
                              </span>
                            ))}
                            {guest.secteurs.length > 2 && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                                +{guest.secteurs.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            guest.statut === 'actif' ? 'bg-green-100 text-green-800' :
                            guest.statut === 'inactif' ? 'bg-gray-100 text-gray-800' :
                            guest.statut === 'à contacter' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {guest.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-indigo-600">{guest.passages.length}</span>
                            <span className="text-xs text-gray-500">total</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedGuest(guest)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedGuest(guest);
                                setIsEditing(true);
                                setEditForm(guest);
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGuest(guest.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                Tableau de bord analytique
              </h2>

              {/* Passages par secteur */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Répartition des passages par secteur</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.passagesBySecteur}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="secteur" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]}>
                      {stats.passagesBySecteur.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Pie Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Distribution par secteur</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.passagesBySecteur}
                        dataKey="count"
                        nameKey="secteur"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {stats.passagesBySecteur.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Line Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Évolution mensuelle des passages</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="passages" stroke="#4f46e5" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top invités */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top 10 des invités les plus présents</h3>
                <div className="space-y-2">
                  {stats.topGuests.map((guest, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{guest.name}</p>
                        <div className="flex gap-1 mt-1">
                          {guest.secteurs.map(s => (
                            <span
                              key={s}
                              className="px-2 py-0.5 text-xs rounded-full text-white"
                              style={{ backgroundColor: SECTEUR_COLORS[s] }}
                            >
                              {SECTEUR_LABELS[s]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">{guest.passages}</p>
                        <p className="text-xs text-gray-500">passages</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-600" />
                Assistant IA pour recommandations
              </h2>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sujet de l'émission</label>
                  <input
                    type="text"
                    placeholder="Ex: transition énergétique, élections..."
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
                  <select
                    value={aiSecteur}
                    onChange={(e) => setAiSecteur(e.target.value as Secteur)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Tous les secteurs</option>
                    {Object.entries(SECTEUR_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <input
                    type="text"
                    placeholder="Ex: interview 15min, débat..."
                    value={aiFormat}
                    onChange={(e) => setAiFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={handleAIRecommendation}
                className="btn bg-purple-600 text-white hover:bg-purple-700 w-full md:w-auto"
              >
                <Brain className="w-4 h-4 inline mr-2" />
                Obtenir des recommandations
              </button>

              {/* Recommendations */}
              {aiRecommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Invités recommandés de la base</h3>
                  <div className="space-y-3">
                    {aiRecommendations.map(guest => (
                      <div key={guest.id} className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{guest.prenom} {guest.nom}</p>
                            <p className="text-sm text-gray-600">{guest.fonction} - {guest.organisation}</p>
                            <p className="text-sm text-gray-700 mt-2">{guest.bio}</p>
                            <div className="flex gap-2 mt-2">
                              {guest.secteurs.map(s => (
                                <span
                                  key={s}
                                  className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                  style={{ backgroundColor: SECTEUR_COLORS[s] }}
                                >
                                  {SECTEUR_LABELS[s]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-2xl font-bold text-purple-600">{guest.passages.length}</p>
                            <p className="text-xs text-gray-500">passages</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Search */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4">Recherche de nouveaux profils externes</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Générez des mots-clés optimisés pour rechercher des profils sur LinkedIn ou d'autres plateformes professionnelles.
                </p>
                <button
                  onClick={handleGenerateKeywords}
                  className="btn bg-blue-600 text-white hover:bg-blue-700 mb-4"
                >
                  Générer des mots-clés de recherche
                </button>
                {aiSearchKeywords && (
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Mots-clés suggérés:</p>
                    <p className="text-lg font-mono text-blue-900">{aiSearchKeywords}</p>
                    <p className="text-xs text-gray-600 mt-3">
                      💡 Copiez ces mots-clés et utilisez-les sur LinkedIn, Google ou d'autres plateformes pour trouver des experts pertinents.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <History className="w-6 h-6 text-gray-600" />
              Journal d'audit des modifications
            </h2>
            <div className="space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-indigo-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{log.action} - {log.entityType}</p>
                      <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                      <p className="text-xs text-gray-500 mt-2">Par: {log.user}</p>
                    </div>
                    <p className="text-xs text-gray-500">{format(log.timestamp, 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucune modification enregistrée</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Guest Detail Modal */}
      {selectedGuest && !isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{selectedGuest.prenom} {selectedGuest.nom}</h2>
                  <p className="text-indigo-100">{selectedGuest.fonction} - {selectedGuest.organisation}</p>
                </div>
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Secteurs et statut */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Secteurs d'expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedGuest.secteurs.map(s => (
                    <span
                      key={s}
                      className="px-3 py-1 text-sm font-medium rounded-full text-white"
                      style={{ backgroundColor: SECTEUR_COLORS[s] }}
                    >
                      {SECTEUR_LABELS[s]}
                    </span>
                  ))}
                </div>
                <p className="mt-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    selectedGuest.statut === 'actif' ? 'bg-green-100 text-green-800' :
                    selectedGuest.statut === 'inactif' ? 'bg-gray-100 text-gray-800' :
                    selectedGuest.statut === 'à contacter' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedGuest.statut}
                  </span>
                </p>
              </div>

              {/* Bio */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Biographie</h3>
                <p className="text-gray-600">{selectedGuest.bio}</p>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Contact</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {selectedGuest.email && <p>📧 {selectedGuest.email}</p>}
                  {selectedGuest.telephone && <p>📞 {selectedGuest.telephone}</p>}
                  {selectedGuest.linkedin && <p>💼 <a href={selectedGuest.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedGuest.linkedin}</a></p>}
                  {selectedGuest.twitter && <p>🐦 {selectedGuest.twitter}</p>}
                  {selectedGuest.site && <p>🌐 <a href={selectedGuest.site} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedGuest.site}</a></p>}
                </div>
              </div>

              {/* Notes */}
              {selectedGuest.notes && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                  <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">{selectedGuest.notes}</p>
                </div>
              )}

              {/* Historique des passages */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Historique des passages ({selectedGuest.passages.length})
                </h3>
                {selectedGuest.passages.length > 0 ? (
                  <div className="space-y-2">
                    {selectedGuest.passages.sort((a, b) => b.date.getTime() - a.date.getTime()).map(passage => (
                      <div key={passage.id} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{passage.emission}</p>
                            <p className="text-sm text-gray-600">{passage.sujet}</p>
                            {passage.notes && <p className="text-xs text-gray-500 mt-1">{passage.notes}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{format(passage.date, 'dd/MM/yyyy')}</p>
                            <p className="text-xs text-gray-500">{passage.duree} min</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucun passage enregistré</p>
                )}
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 pt-4 border-t">
                <p>Créé le {format(selectedGuest.createdAt, 'dd/MM/yyyy à HH:mm')} par {selectedGuest.createdBy}</p>
                <p>Dernière modification le {format(selectedGuest.updatedAt, 'dd/MM/yyyy à HH:mm')} par {selectedGuest.lastModifiedBy}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Guest Modal */}
      {(isEditing || showAddGuest) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{isEditing ? 'Modifier l\'invité' : 'Nouvel invité'}</h2>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setShowAddGuest(false);
                    setSelectedGuest(null);
                    setEditForm({});
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={editForm.prenom || ''}
                    onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={editForm.nom || ''}
                    onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organisation</label>
                  <input
                    type="text"
                    value={editForm.organisation || ''}
                    onChange={(e) => setEditForm({ ...editForm, organisation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fonction</label>
                  <input
                    type="text"
                    value={editForm.fonction || ''}
                    onChange={(e) => setEditForm({ ...editForm, fonction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Biographie</label>
                <textarea
                  value={editForm.bio || ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={editForm.statut || 'actif'}
                    onChange={(e) => setEditForm({ ...editForm, statut: e.target.value as Statut })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="à contacter">À contacter</option>
                    <option value="blacklisté">Blacklisté</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secteurs</label>
                  <select
                    multiple
                    value={editForm.secteurs || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value as Secteur);
                      setEditForm({ ...editForm, secteurs: selected });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    size={5}
                  >
                    {Object.entries(SECTEUR_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Maintenez Ctrl/Cmd pour sélectionner plusieurs</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={editForm.telephone || ''}
                    onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={editForm.linkedin || ''}
                    onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                  <input
                    type="text"
                    value={editForm.twitter || ''}
                    onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                  <input
                    type="url"
                    value={editForm.site || ''}
                    onChange={(e) => setEditForm({ ...editForm, site: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes internes</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Disponibilités, préférences, remarques..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSaveGuest}
                  className="btn btn-primary flex items-center gap-2 flex-1"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setShowAddGuest(false);
                    setSelectedGuest(null);
                    setEditForm({});
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-green-600 to-teal-600 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Import Excel/CSV</h2>
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportData([]);
                    setColumnMapping({});
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un fichier Excel (.xlsx) ou CSV</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {importData.length > 0 && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      ✓ {importData.length} ligne(s) détectée(s)
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Mapping des colonnes</h3>
                    <p className="text-sm text-gray-600 mb-4">Associez les colonnes de votre fichier aux champs de la base de données:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {['nom', 'prenom', 'email', 'telephone', 'organisation', 'fonction', 'linkedin', 'bio'].map(field => (
                        <div key={field}>
                          <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{field} {['nom', 'prenom'].includes(field) && '*'}</label>
                          <select
                            value={columnMapping[field] || ''}
                            onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">-- Non mappé --</option>
                            {Object.keys(importData[0]).map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleImportData}
                      className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 flex-1"
                      disabled={!columnMapping['nom'] || !columnMapping['prenom']}
                    >
                      <Upload className="w-4 h-4" />
                      Importer les données
                    </button>
                    <button
                      onClick={() => {
                        setShowImport(false);
                        setImportData([]);
                        setColumnMapping({});
                      }}
                      className="btn btn-secondary flex-1"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
