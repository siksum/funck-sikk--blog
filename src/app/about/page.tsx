'use client';

import { motion } from 'framer-motion';

export default function AboutPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        className="relative py-20 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-indigo-50 to-purple-100 dark:from-violet-950/30 dark:via-indigo-950/20 dark:to-purple-950/30" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col md:flex-row items-center gap-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Profile Avatar */}
            <motion.div
              className="relative group"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-xl shadow-violet-500/30 dark:shadow-violet-500/20">
                NK
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </motion.div>

            {/* Profile Info */}
            <motion.div
              className="text-center md:text-left flex-1"
              variants={fadeInUp}
            >
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Namryeong Kim
              </h1>
              <p className="text-xl text-violet-600 dark:text-violet-400 font-medium mb-2">
                Security Researcher
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                M.S. Candidate in Convergence Security Engineering<br />
                Sungshin Women&apos;s University
              </p>

              {/* Social Links */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <motion.a
                  href="https://github.com/siksum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-800 transition-all duration-200 text-sm shadow-sm"
                  whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(139, 92, 246, 0.15)" }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </motion.a>
                <motion.a
                  href="mailto:namyoung0718@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-800 transition-all duration-200 text-sm shadow-sm"
                  whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(139, 92, 246, 0.15)" }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </motion.a>
                <motion.a
                  href="https://t.me/siksum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-800 transition-all duration-200 text-sm shadow-sm"
                  whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(139, 92, 246, 0.15)" }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Research Interests */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            Research Interests
          </h2>
          <div className="flex flex-wrap gap-3">
            {['Web3 Security', 'Automated Vulnerability Detection', 'AI Security'].map((interest, index) => (
              <motion.span
                key={interest}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 text-violet-700 dark:text-violet-300 rounded-full font-medium border border-violet-200 dark:border-violet-800"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                {interest}
              </motion.span>
            ))}
          </div>
        </motion.section>

        {/* Education & Research Experience - Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            Education & Experience
          </h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-indigo-500 to-purple-500" />

            {/* Timeline items */}
            <div className="space-y-8">
              {[
                { year: '2024 - Current', title: 'M.S. Candidate', subtitle: 'Convergence Security Engineering', org: 'Sungshin Women\'s University', detail: 'Advisor: Ilgu Lee | GPA: 4.5/4.5', type: 'education' },
                { year: '2022 - 2023', title: 'Undergraduate Internship', subtitle: 'Pwnlab', org: '', detail: 'Advisor: Daehee Jang', type: 'experience' },
                { year: '2022', title: 'Undergraduate Internship', subtitle: 'NSSec', org: '', detail: 'Advisor: Sungmin Kim', type: 'experience' },
                { year: '2021 - 2022', title: 'Undergraduate Internship', subtitle: 'CSE Lab', org: '', detail: 'Advisor: Ilgu Lee', type: 'experience' },
                { year: '2019 - 2023', title: 'B.S.', subtitle: 'Convergence Security Engineering', org: 'Sungshin Women\'s University', detail: 'GPA: 4.33/4.5', type: 'education' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 md:left-1/2 w-3 h-3 -translate-x-1/2 rounded-full bg-white dark:bg-gray-900 border-4 border-violet-500 z-10" />

                  {/* Content */}
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <motion.div
                      className="p-5 bg-white dark:bg-gray-800/80 rounded-xl border border-violet-100 dark:border-violet-900/50 shadow-sm hover:shadow-md transition-shadow"
                      whileHover={{ y: -2 }}
                    >
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                        item.type === 'education'
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                          : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      }`}>
                        {item.year}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-violet-600 dark:text-violet-400 font-medium">{item.subtitle}</p>
                      {item.org && <p className="text-gray-600 dark:text-gray-400 text-sm">{item.org}</p>}
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">{item.detail}</p>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Publications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            Selected Publications
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'rPBFT: Reliable Practical Byzantine Fault Tolerance Mechanism for Faulty Distributed Networks', venue: 'IEEE Transactions on Big Data (2025)', note: 'Co-first author', featured: true },
              { title: 'Access-control vulnerability detection in DeFi smart contracts', venue: 'KIISC Journal (Dec 2025)', featured: true },
              { title: 'DeFi smart contract security via LangChain and RAG', venue: 'WISA 2025', featured: false },
              { title: 'Fault-tolerant consensus mechanisms for blockchain', venue: 'IEEE Consumer Technology - Pacific 2025', featured: false },
            ].map((pub, index) => (
              <motion.div
                key={index}
                className={`p-5 rounded-xl border transition-all ${
                  pub.featured
                    ? 'bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-violet-300 dark:border-violet-700'
                    : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(139, 92, 246, 0.1)" }}
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 leading-snug">{pub.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{pub.venue}</p>
                {pub.note && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded text-xs font-medium">
                    {pub.note}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Honors & Awards - Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </span>
            Honors & Awards
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'ICT Convergence Security Crew Best Crew Award', year: '2025', highlight: true },
              { title: 'National Security Technology Research Institute Director Award', year: '2025', highlight: true },
              { title: 'Korea Information Technology Association President\'s Award', year: '2025', highlight: true },
              { title: 'Best Paper Award', org: 'Korea Convergence Security Association', year: '2024', highlight: false },
              { title: 'First Prize, Convergence Security Creative Software Competition', year: '2024', highlight: false },
              { title: 'First Prize, Protocol Camp 5th', year: '2024', highlight: false },
            ].map((award, index) => (
              <motion.div
                key={index}
                className={`p-4 rounded-xl border ${
                  award.highlight
                    ? 'bg-gradient-to-br from-violet-100/80 to-indigo-100/80 dark:from-violet-900/30 dark:to-indigo-900/30 border-violet-300 dark:border-violet-700'
                    : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                }`}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">{award.title}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{award.year}</span>
                  {award.org && <span className="truncate">| {award.org}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Professional Activities */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            Professional Activities
          </h2>

          <div className="space-y-6">
            {/* Club Leadership */}
            <div className="p-5 bg-white dark:bg-gray-800/80 rounded-xl border border-violet-100 dark:border-violet-900/50">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">HASH (Hacking Club)</h3>
              <div className="flex flex-wrap gap-2">
                {['Founding Member (2021)', 'Vice President (2021)', 'President (2022)'].map((role, i) => (
                  <motion.span
                    key={role}
                    className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {role}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* External Programs */}
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Convergence Security Crew', role: 'AI Security Team Leader', period: '2025.05 - 2025.12', desc: 'DeFi vulnerability detection & LLM prompt injection prevention' },
                { title: 'Protocol Camp 5th', role: 'Team Leader (AntiBug)', period: '2023.09 - 2023.12', desc: 'VSCode security assistant for smart contract analysis' },
                { title: 'DreamPlus Academy 2nd', role: '', period: '2023.03 - 2023.06', desc: 'Blockchain security training & static analysis detector development' },
              ].map((prog, index) => (
                <motion.div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ borderColor: "rgb(139 92 246 / 0.5)" }}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">{prog.title}</h4>
                  {prog.role && <p className="text-violet-600 dark:text-violet-400 text-sm">{prog.role}</p>}
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{prog.period}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">{prog.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Patents */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            Patents (Code Copyright)
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Solidity compiler version automatic detection and installation management program', code: 'C-2025-031742' },
              { title: 'Global lock-based smart contract security module', code: 'C-2025-031743' },
            ].map((patent, index) => (
              <motion.div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ }}
                transition={{ duration: 0.4 }}
                whileHover={{ borderColor: "rgb(139 92 246 / 0.5)" }}
              >
                <p className="font-medium text-gray-900 dark:text-white mb-2">{patent.title}</p>
                <span className="text-sm text-violet-600 dark:text-violet-400 font-mono">{patent.code}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
