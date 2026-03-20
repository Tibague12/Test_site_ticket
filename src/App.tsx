/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Search, 
  Menu, 
  X, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  Trophy, 
  Activity, 
  Users, 
  Ticket,
  ArrowRight,
  Star,
  LogOut,
  User as UserIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Une erreur inattendue est survenue.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) message = `Erreur de base de données : ${parsed.error}`;
      } catch (e) {
        message = this.state.error.message || message;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-zinc-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Oups !</h2>
            <p className="text-zinc-600 mb-8">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Constants ---
const CATEGORIES = [
  { name: 'Tous', icon: <Activity className="w-4 h-4" /> },
  { name: 'Football', icon: <Trophy className="w-4 h-4" /> },
  { name: 'Handball', icon: <Activity className="w-4 h-4" /> },
  { name: 'Volleyball', icon: <Activity className="w-4 h-4" /> },
  { name: 'Autres sports', icon: <Star className="w-4 h-4" /> },
];

const FEATURED_EVENTS = [
  {
    id: 1,
    title: 'PSG vs Marseille',
    sport: 'Football',
    category: 'Football',
    date: '25 Mars 2026',
    location: 'Parc des Princes, Paris',
    price: 85,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 2,
    title: 'Montpellier vs Nantes',
    sport: 'Handball',
    category: 'Handball',
    date: '28 Mars 2026',
    location: 'Sud de France Arena, Montpellier',
    price: 25,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 3,
    title: 'Tours vs Chaumont',
    sport: 'Volleyball',
    category: 'Volleyball',
    date: '30 Mars 2026',
    location: 'Salle Grenon, Tours',
    price: 15,
    image: 'https://images.unsplash.com/photo-1592656670411-591e4338970e?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 4,
    title: 'France vs Angleterre',
    sport: 'Rugby',
    category: 'Autres sports',
    date: '05 Avril 2026',
    location: 'Stade de France, Saint-Denis',
    price: 120,
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
  },
];

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  login: () => Promise<void>;
  register: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserProfile = async (currentUser: User) => {
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setProfile(userDoc.data());
      } else {
        // Create profile if it doesn't exist (Registration)
        const newProfile = {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          role: 'client',
          createdAt: serverTimestamp()
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
        console.log("Nouveau profil utilisateur créé avec succès !");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Erreur de connexion :", error);
    }
  };

  const register = async () => {
    // For Google Auth, login and register use the same flow
    // The syncUserProfile function handles the DB entry
    await login();
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erreur de déconnexion :", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Main App Component ---
function BuyTicketApp() {
  const { user, profile, loading, login, logout, register } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const filteredEvents = FEATURED_EVENTS.filter(event => {
    const matchesCategory = selectedCategory === 'Tous' || event.category === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         event.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-zinc-500 font-medium">Chargement de BuyTicket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                <Ticket className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-purple-900">BuyTicket</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-medium text-zinc-600 hover:text-purple-600 transition-colors">Accueil</a>
              <a href="#" className="text-sm font-medium text-zinc-600 hover:text-purple-600 transition-colors">Événements</a>
              <a href="#" className="text-sm font-medium text-zinc-600 hover:text-purple-600 transition-colors">Sports</a>
              <a href="#" className="text-sm font-medium text-zinc-600 hover:text-purple-600 transition-colors">Aide</a>
              
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 p-1 pr-4 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-all border border-zinc-200"
                  >
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full border border-white"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-sm font-semibold text-zinc-700">{user.displayName?.split(' ')[0]}</span>
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-zinc-100 py-2 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-zinc-50">
                          <p className="text-sm font-bold text-zinc-900">{user.displayName}</p>
                          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        </div>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                          <UserIcon className="w-4 h-4" />
                          Mon Profil
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                          <Ticket className="w-4 h-4" />
                          Mes Billets
                        </button>
                        <div className="h-px bg-zinc-50 my-1" />
                        <button 
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={login}
                    className="text-sm font-semibold text-zinc-600 hover:text-purple-600 transition-colors px-4 py-2"
                  >
                    Connexion
                  </button>
                  <button 
                    onClick={register}
                    className="bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                  >
                    S'inscrire
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-zinc-600">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-zinc-200 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {user && (
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl mb-4">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">{user.displayName}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                )}
                <a href="#" className="block text-lg font-medium text-zinc-900">Accueil</a>
                <a href="#" className="block text-lg font-medium text-zinc-900">Événements</a>
                <a href="#" className="block text-lg font-medium text-zinc-900">Sports</a>
                <a href="#" className="block text-lg font-medium text-zinc-900">Aide</a>
                {user ? (
                  <button 
                    onClick={logout}
                    className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Déconnexion
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button 
                      onClick={login}
                      className="w-full bg-zinc-100 text-zinc-900 py-3 rounded-xl font-semibold"
                    >
                      Connexion
                    </button>
                    <button 
                      onClick={register}
                      className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold"
                    >
                      S'inscrire
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=1920" 
              alt="Stadium" 
              className="w-full h-full object-cover brightness-50"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 to-zinc-900/80" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight"
            >
              Vivez le sport <span className="text-purple-400">en direct</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-zinc-200 mb-10 max-w-2xl mx-auto"
            >
              Réservez vos places pour les plus grands matchs de football, handball, volleyball et bien plus encore.
            </motion.p>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto"
            >
              <div className="flex-1 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-zinc-100">
                <Search className="text-zinc-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Événement, équipe ou stade..." 
                  className="w-full py-3 outline-none text-zinc-800 placeholder:text-zinc-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-zinc-100 min-w-[200px]">
                <MapPin className="text-zinc-400 w-5 h-5" />
                <span className="text-zinc-500 text-sm">Toute la France</span>
              </div>
              <button className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
                Rechercher
              </button>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button 
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all whitespace-nowrap font-medium border ${
                    selectedCategory === cat.name 
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200' 
                    : 'bg-zinc-100 text-zinc-700 hover:bg-purple-50 hover:text-purple-600 border-transparent hover:border-purple-200'
                  }`}
                >
                  {cat.icon}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 mb-2">
                  {selectedCategory === 'Tous' ? 'Événements à la une' : `Événements : ${selectedCategory}`}
                </h2>
                <p className="text-zinc-500">
                  {filteredEvents.length > 0 
                    ? 'Ne manquez pas les meilleures affiches du moment' 
                    : 'Aucun événement trouvé pour cette catégorie'}
                </p>
              </div>
              <a href="#" className="hidden md:flex items-center gap-2 text-purple-600 font-semibold hover:gap-3 transition-all">
                Voir tout <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-zinc-100"
                  >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-purple-600 uppercase tracking-wider">
                      {event.sport}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-zinc-900 mb-4 line-clamp-1">{event.title}</h3>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-zinc-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500 text-sm">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                      <div>
                        <span className="text-xs text-zinc-400 block uppercase font-bold">À partir de</span>
                        <span className="text-xl font-bold text-purple-600">{event.price}€</span>
                      </div>
                      <button className="bg-zinc-900 text-white p-3 rounded-2xl hover:bg-purple-600 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* VIP Section */}
        <section className="py-24 bg-gradient-to-br from-zinc-50 to-purple-50/30 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-200/50 blur-3xl rounded-full" />
                <div className="relative z-10">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-bold uppercase tracking-wider mb-6">
                    Expérience Exclusive
                  </span>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 mb-8 leading-tight">
                    Élevez votre passion avec nos <span className="text-purple-600">Offres VIP</span>
                  </h2>
                  <p className="text-lg text-zinc-600 mb-10 leading-relaxed">
                    Accédez au prestige. Profitez des meilleurs emplacements, d'un service personnalisé et de moments inoubliables au cœur de l'action.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-center text-purple-600">
                        <Star className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900">Loges & Salons Privés</h4>
                        <p className="text-zinc-500 text-sm">Confort absolu et vue imprenable sur le terrain.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-center text-purple-600">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900">Service Gastronomique</h4>
                        <p className="text-zinc-500 text-sm">Cocktails dînatoires et boissons à discrétion.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-center text-purple-600">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900">Accès Prioritaire</h4>
                        <p className="text-zinc-500 text-sm">Entrée dédiée et accueil personnalisé par nos hôtes.</p>
                      </div>
                    </div>
                  </div>

                  <button className="mt-12 bg-purple-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 flex items-center gap-3">
                    Découvrir les offres VIP <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=1000" 
                    alt="VIP Experience" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent" />
                  <div className="absolute bottom-10 left-10 right-10">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl text-white">
                      <p className="italic text-lg mb-4">"Une expérience hors du commun. Le service VIP a transformé notre soirée au stade en un souvenir mémorable."</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold">JD</div>
                        <div>
                          <p className="font-bold text-sm">Jean Dupont</p>
                          <p className="text-xs text-white/70">Client Premium</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-2xl border border-zinc-100 hidden md:block">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Disponibilité</p>
                      <p className="text-zinc-900 font-bold">Places Limitées</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-24 bg-zinc-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-900/20 blur-[120px] rounded-full -ml-48 -mb-48" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Pourquoi choisir BuyTicket ?</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">La plateforme de référence pour tous les passionnés de sport en France.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/20">
                  <Ticket className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Billets 100% Officiels</h3>
                <p className="text-zinc-400">Nous travaillons directement avec les clubs et les fédérations pour vous garantir des billets authentiques.</p>
              </div>
              <div className="text-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/20">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Réservation Instantanée</h3>
                <p className="text-zinc-400">Recevez vos e-billets immédiatement après votre achat sur votre smartphone ou par email.</p>
              </div>
              <div className="text-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/20">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Service Client 24/7</h3>
                <p className="text-zinc-400">Notre équipe est à votre disposition pour vous accompagner avant, pendant et après l'événement.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-purple-600 rounded-[40px] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-purple-200">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Ne ratez aucune grande affiche</h2>
                <p className="text-purple-100 mb-10 max-w-xl mx-auto text-lg">Inscrivez-vous à notre newsletter pour recevoir les alertes billetterie en avant-première.</p>
                <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
                  <input 
                    type="email" 
                    placeholder="Votre adresse email" 
                    className="flex-1 px-6 py-4 rounded-2xl bg-white text-zinc-900 outline-none focus:ring-4 ring-purple-400/30 transition-all"
                  />
                  <button className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-colors shadow-lg">
                    S'abonner
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-50 border-t border-zinc-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                  <Ticket className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-purple-900">BuyTicket</span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">
                La plateforme leader pour la billetterie sportive en France. Simplifiez vos réservations et vivez vos passions.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 mb-6">Navigation</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-purple-600 transition-colors">Accueil</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Tous les sports</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Villes</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Promotions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 mb-6">Support</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-purple-600 transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Contactez-nous</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Remboursements</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 mb-6">Légal</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-purple-600 transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">CGV</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-400 text-xs">© 2026 BuyTicket. Tous droits réservés.</p>
            <div className="flex gap-6">
              <a href="#" className="text-zinc-400 hover:text-purple-600 transition-colors">Instagram</a>
              <a href="#" className="text-zinc-400 hover:text-purple-600 transition-colors">Twitter</a>
              <a href="#" className="text-zinc-400 hover:text-purple-600 transition-colors">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BuyTicketApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
