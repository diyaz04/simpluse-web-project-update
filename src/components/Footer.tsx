import { Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-bg-dark border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <a href="#home" className="flex items-center gap-2">
              <img
                src="https://lh3.googleusercontent.com/d/15YQcmpQm-deZO0bBEcH302uBZ8GthiYA"
                alt="Simpluse Logo"
                className="w-12 h-12 object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="font-display font-bold text-2xl tracking-tight">
                Simpluse<span className="text-brand-orange">.</span>
              </span>
            </a>
            <p className="text-text-secondary leading-relaxed">
              Partner terpercaya untuk transformasi digital bisnis Anda. Membangun website modern dengan performa maksimal.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 rounded-lg glass hover:text-brand-orange transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="p-2 rounded-lg glass hover:text-brand-orange transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="p-2 rounded-lg glass hover:text-brand-orange transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-4 text-text-secondary">
              <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#portfolio" className="hover:text-white transition-colors">Portfolio</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Layanan</h4>
            <ul className="space-y-4 text-text-secondary">
              <li><a href="#" className="hover:text-white transition-colors">Company Profile</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Landing Page</a></li>
              <li><a href="#" className="hover:text-white transition-colors">E-Commerce</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Web Application</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Maintenance</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Kontak</h4>
            <ul className="space-y-4 text-text-secondary">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-orange shrink-0" />
                <span>Tasikmalaya, Jawa Barat</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-orange shrink-0" />
                <span>+62 859 5031 9228</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-orange shrink-0" />
                <span>simpluseproject@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-text-secondary text-sm">
          <p>© {new Date().getFullYear()} Simpluse Web Project. All rights reserved.</p>
          <a href="?admin=true" className="hover:text-brand-orange transition-colors opacity-50 hover:opacity-100">Login Admin</a>
        </div>
      </div>
    </footer>
  );
}
