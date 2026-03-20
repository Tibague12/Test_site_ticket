/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface SportEvent {
  id: string;
  title: string;
  sport: string;
  date: string;
  location: string;
  price: number;
  image: string;
  category: string;
}

const FEATURED_EVENTS: SportEvent[] = [
  {
    id: '1',
    title: 'PSG vs Marseille - Classique',
    sport: 'Football',
    date: '25 Mars 2026',
    location: 'Parc des Princes, Paris',
    price: 85,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
    category: 'Football'
  },
  {
    id: '2',
    title: 'Finales de la Coupe de France',
    sport: 'Handball',
    date: '12 Avril 2026',
    location: 'Accor Arena, Paris',
    price: 45,
    image: 'https://images.unsplash.com/photo-1519861531473-920036214751?auto=format&fit=crop&q=80&w=800',
    category: 'Handball'
  },
  {
    id: '3',
    title: 'Championnat National',
    sport: 'Volleyball',
    date: '05 Avril 2026',
    location: 'Palais des Sports, Lyon',
    price: 30,
    image: 'https://images.unsplash.com/photo-1592656670411-591e9c174631?auto=format&fit=crop&q=80&w=800',
    category: 'Volleyball'
  },
  {
    id: '4',
    title: 'Tournoi des Six Nations',
    sport: 'Rugby',
    date: '18 Mars 2026',
    location: 'Stade de France, Saint-Denis',
    price: 95,
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
    category: 'Rugby'
  }
];

const CATEGORIES = [
  { name: 'Football', icon: <Trophy className="w-5 h-5" /> },
  { name: 'Handball', icon: <Activity className="w-5 h-5" /> },
  { name: 'Volleyball', icon: <Users className="w-5 h-5" /> },
  { name: 'Rugby', icon: <Ticket className="w-5 h-5" /> },
  { name: 'Basketball', icon: <Star className="w-5 h-5" /> },
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
              <button className="bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200">
                Connexion
              </button>
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
                <a href="#" className="block text-lg font-medium text-zinc-900">Accueil</a>
                <a href="#" className="block text-lg font-medium text-zinc-900">Événements</a>
                <a href="#" className="block text-lg font-medium text-zinc-900">Sports</a>
                <a href="#" className="block text-lg font-medium text-zinc-900">Aide</a>
                <button className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold">
                  Connexion
                </button>
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
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-100 text-zinc-700 hover:bg-purple-50 hover:text-purple-600 transition-all whitespace-nowrap font-medium border border-transparent hover:border-purple-200"
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
                <h2 className="text-3xl font-bold text-zinc-900 mb-2">Événements à la une</h2>
                <p className="text-zinc-500">Ne manquez pas les meilleures affiches du moment</p>
              </div>
              <a href="#" className="hidden md:flex items-center gap-2 text-purple-600 font-semibold hover:gap-3 transition-all">
                Voir tout <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURED_EVENTS.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
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
