import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useApp } from "../AppContext";

export default function Hero() {
  const { content } = useApp();

  const title = content?.hero?.title || "Simpluse Web Project";
  const subtitle = content?.hero?.subtitle || "Solusi Website Profesional, Modern, dan Sesuai Kebutuhan Anda. Kami membantu bisnis Anda tumbuh dengan teknologi web terkini.";

  // Split title to highlight "Simpluse"
  const titleParts = title.split(" ");
  const firstWord = titleParts[0];
  const restOfTitle = titleParts.slice(1).join(" ");

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-bg-dark">
      {/* Background orange aura inspired by the landing reference. */}
      <div className="hero-orange-aura" />
      <div className="hero-center-vignette" />
      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[920px] h-[920px] rounded-full border border-white/[0.03] pointer-events-none" />
      <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[650px] h-[650px] rounded-full border border-white/[0.035] pointer-events-none" />
      <div className="absolute bottom-[-180px] left-1/2 -translate-x-1/2 w-[720px] h-[300px] bg-sky-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
        >
          <Sparkles className="w-4 h-4 text-brand-orange" />
          <span className="text-sm font-medium text-text-secondary">Available for new projects</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight mb-6"
        >
          <span className="gradient-text">{firstWord}</span> {restOfTitle}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#portfolio"
            className="group gradient-bg text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:scale-105 transition-transform"
          >
            Lihat Portofolio
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#contact"
            className="px-8 py-4 rounded-full font-bold text-lg glass hover:bg-white/10 transition-colors"
          >
            Konsultasi Gratis
          </a>
        </motion.div>
      </div>

      {/* Tech Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-4xl border border-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl max-h-2xl border border-white/5 rounded-full" />
      </div>
    </section>
  );
}
