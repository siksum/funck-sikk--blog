'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function AboutPage() {
  const [expandedSections, setExpandedSections] = useState({
    journals: true,
    international: false,
    domestic: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
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
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-indigo-50 to-purple-100 dark:from-violet-950/30 dark:via-indigo-950/20 dark:to-purple-950/30" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col md:flex-row items-center gap-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div
              className="relative group"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative w-40 h-40 rounded-full overflow-hidden ring-4 ring-violet-200 dark:ring-violet-800 shadow-xl shadow-violet-500/30 dark:shadow-violet-500/20">
                <Image
                  src="/profile.jpg"
                  alt="Namryeong Kim"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </motion.div>

            <motion.div className="text-center md:text-left flex-1" variants={fadeInUp}>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Namryeong Kim</h1>
              <p className="text-xl text-violet-600 dark:text-violet-400 font-medium mb-2">Security Researcher</p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                M.S. Candidate in Convergence Security Engineering<br />
                Sungshin Women&apos;s University, Prime #603
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <motion.a
                  href="https://github.com/siksum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-800 transition-all duration-200 text-sm shadow-sm"
                  whileHover={{ y: -2 }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </motion.a>
                <motion.a
                  href="mailto:namyoung0718@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-800 transition-all duration-200 text-sm shadow-sm"
                  whileHover={{ y: -2 }}
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
                  whileHover={{ y: -2 }}
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
        {/* Bio */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-6 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl border border-violet-200 dark:border-violet-800">
            <p className="text-lg text-violet-700 dark:text-violet-300 font-medium italic text-center mb-4">
              &ldquo;올바른 가치관과 신념으로 나눌 줄 아는, 지혜로운 사람이 되고 싶습니다&rdquo;
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-center">
              맡은 일에 대해 책임감 있으며 다양한 방법을 시도해보는 것을 좋아합니다.
              알고 있는 것을 함께 나누기 위해 준비하고 실제로 나누는 과정에서 성취감을 느낍니다.
              &lsquo;지식은 나눌수록 커진다.&rsquo;라는 말이 있듯, 누구나 쉽게 보안을 접하고 관심 가질 수 있도록
              경험과 지식을 공유하는 사람이 되고 싶습니다.
            </p>
          </div>
        </motion.section>

        {/* Research Interests & In Progress */}
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
          <div className="flex flex-wrap gap-3 mb-8">
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

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            In Progress
          </h3>
          <div className="space-y-3">
            {[
              'DeFi vulnerability detection techniques',
              'LLM prompt injection detection and prevention',
              'Decentralized ID threat modeling and security framework',
            ].map((item, index) => (
              <motion.div
                key={index}
                className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ }}
                transition={{ delay: index * 0.1 }}
              >
                Researching on {item}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Education & Experience - Timeline */}
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
                { year: '2024.09 - Current', title: 'M.S. Candidate', subtitle: 'Convergence Security Engineering', org: 'Sungshin Women\'s University', detail: 'Advisor: Ilgu Lee | GPA: 4.5/4.5', type: 'education' },
                { year: '2025.03 - 08', title: 'Research Assistant (RA)', subtitle: 'CSE Lab', org: 'Sungshin Women\'s University', detail: 'Advisor: Ilgu Lee', type: 'work' },
                { year: '2024.03 - 06', title: 'Community Manager', subtitle: 'Protocol Camp 6th', org: 'Hanwha Life (Dreamplus)', detail: '', type: 'work' },
                { year: '2023.07 - 08', title: 'Community Manager', subtitle: 'SWF Accelerator', org: 'Hanwha Life (Dreamplus)', detail: '', type: 'work' },
                { year: '2022.03 - 2023.01', title: 'Undergraduate Internship', subtitle: 'Pwnlab', org: 'Sungshin Women\'s University', detail: 'Advisor: Daehee Jang', type: 'research' },
                { year: '2022.01 - 02', title: 'Undergraduate Internship', subtitle: 'NSSec', org: 'Sungshin Women\'s University', detail: 'Advisor: Sungmin Kim', type: 'research' },
                { year: '2021.03 - 12', title: 'Undergraduate Internship', subtitle: 'CSE Lab', org: 'Sungshin Women\'s University', detail: 'Advisor: Ilgu Lee', type: 'research' },
                { year: '2019.03 - 2023.02', title: 'B.S.', subtitle: 'Convergence Security Engineering', org: 'Sungshin Women\'s University', detail: 'GPA: 4.33/4.5', type: 'education' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 md:left-1/2 w-3 h-3 -translate-x-1/2 rounded-full bg-white dark:bg-gray-900 border-4 border-violet-500 z-10" />

                  {/* Content */}
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <motion.div
                      className="p-4 bg-white dark:bg-gray-800/80 rounded-xl border border-violet-100 dark:border-violet-900/50 shadow-sm hover:shadow-md transition-shadow"
                      whileHover={{ y: -2 }}
                    >
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                        item.type === 'education'
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                          : item.type === 'research'
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {item.year}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-violet-600 dark:text-violet-400 font-medium">{item.subtitle}</p>
                      {item.org && <p className="text-gray-600 dark:text-gray-400 text-sm">{item.org}</p>}
                      {item.detail && <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">{item.detail}</p>}
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
            Publications
          </h2>

          {/* Journals */}
          <button
            onClick={() => toggleSection('journals')}
            className="w-full flex items-center justify-between text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              Journals
              <span className="text-sm font-normal text-violet-600 dark:text-violet-400">(4)</span>
            </span>
            <motion.svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: expandedSections.journals ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          <AnimatePresence>
          {expandedSections.journals && (
          <motion.div
            className="space-y-4 mb-8"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {[
              {
                authors: 'Eunyoung Lee*, Namryeong Kim* (co-first), Chaerim Han, Nayeon Shin, Ilgu Lee',
                title: 'rPBFT: Reliable Practical Byzantine Fault Tolerance Mechanism for Faulty Distributed Networks',
                venue: 'IEEE Transactions on Big Data, 2025',
                badge: 'SCIE, IF5.7, Q1, JCR Top 11.9%',
                featured: true
              },
              {
                authors: 'Hyobeen Cho, Namryeong Kim, Ilgu Lee',
                title: 'Design and Evaluation of an Intelligent Static Analysis Framework for Detecting Access-Control Vulnerabilities in DeFi Smart Contracts',
                venue: 'Journal of the Korea Institute of Information Security & Cryptology, Vol. 35, No. 6, Dec 2025',
                badge: 'KCI',
                korean: 'DeFi 스마트 컨트랙트 접근 제어 취약점 탐지를 위한 지능형 정적 분석 프레임워크의 설계 및 평가'
              },
              {
                authors: 'Namryeong Kim, Dongju Ryu, Ilgu Lee',
                title: 'Code Similarity-Based Framework for Smart Contract Attack Surface Analysis',
                venue: 'Journal of Korea Information Assurance Society, Vol. 24, No. 5, 2024',
                badge: 'KCI',
                korean: '코드 유사성 비교 기반의 스마트 컨트랙트 공격 표면 분석 프레임워크'
              },
              {
                authors: 'Eunyoung Lee, Namryeong Kim, Chaerim Han, Ilgu Lee',
                title: 'Evaluation and Comparative Analysis of Scalability and Fault Tolerance for Practical Byzantine Fault Tolerant based Blockchain',
                venue: 'Journal of the Korea Institute of Information and Communication Engineering, Vol. 26, No. 2, 2022',
                badge: 'KCI',
                korean: '프랙티컬 비잔틴 장애 허용 기반 블록체인의 확장성과 내결함성 평가 및 비교분석'
              },
            ].map((pub, index) => (
              <motion.div
                key={index}
                className={`p-5 rounded-xl border ${pub.featured ? 'bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-violet-300 dark:border-violet-700' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${pub.featured ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{pub.badge}</span>
                </div>
                <p className="text-sm text-violet-600 dark:text-violet-400 mb-1">{pub.authors}</p>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">&ldquo;{pub.title}&rdquo;</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{pub.venue}</p>
                {pub.korean && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1"># {pub.korean}</p>}
              </motion.div>
            ))}
          </motion.div>
          )}
          </AnimatePresence>

          {/* International Conference */}
          <button
            onClick={() => toggleSection('international')}
            className="w-full flex items-center justify-between text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              International Conference
              <span className="text-sm font-normal text-violet-600 dark:text-violet-400">(3)</span>
            </span>
            <motion.svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: expandedSections.international ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          <AnimatePresence>
          {expandedSections.international && (
          <motion.div
            className="space-y-3 mb-8"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {[
              { authors: 'Hyobeen Cho, Namryeong Kim, Sunwoo Jeong, Ilgu Lee', title: 'Enhancing DeFi Smart Contract Security via LangChain and Retrieval-Augmented Generation', venue: 'World Conference on Information Security Applications (WISA) 2025, Jeju, Aug. 21, 2025' },
              { authors: 'Namryeong Kim, Ilgu Lee', title: 'A Fault-Tolerant Consensus Mechanism for Scalable and Reliable Blockchain Systems', venue: 'IEEE International Conference on Consumer Technology - Pacific 2025, Matsue Shimane, Japan, Mar. 31, 2025' },
              { authors: 'Namryeong Kim, Ilgu Lee', title: 'Reliable Practical Byzantine Fault Tolerance Mechanism for High Throughput and Low Latency Blockchain Consensus', venue: 'World Conference on Information Security Applications (WISA) 2024, Aug. 22, 2024 (Poster)' },
            ].map((pub, index) => (
              <motion.div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ }}
                transition={{ delay: index * 0.05 }}
              >
                <p className="text-sm text-violet-600 dark:text-violet-400 mb-1">{pub.authors}</p>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">&ldquo;{pub.title}&rdquo;</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pub.venue}</p>
              </motion.div>
            ))}
          </motion.div>
          )}
          </AnimatePresence>

          {/* Domestic Conference */}
          <button
            onClick={() => toggleSection('domestic')}
            className="w-full flex items-center justify-between text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              Domestic Conference
              <span className="text-sm font-normal text-violet-600 dark:text-violet-400">(11)</span>
            </span>
            <motion.svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: expandedSections.domestic ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          <AnimatePresence>
          {expandedSections.domestic && (
          <motion.div
            className="space-y-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {[
              { authors: 'Namryeong Kim, Sunwoo Jeong, Hyobeen Cho, Eunseo Youk, Ilgu Lee', title: 'A Retrieval-Augmented Chain-of-Thought Framework for Vulnerability Detection in DeFi Smart Contracts', venue: 'Annual Conference of KIPS (ACK) 2025, Nov. 7, 2025', korean: 'Retrieval-Augmented Chain-of-Thought 프레임워크를 활용한 DeFi 스마트 컨트랙트 취약점 탐지' },
              { authors: 'Hyobeen Cho, Namryeong Kim, Sunwoo Jeong, Eunseo Youk, Ilgu Lee', title: 'A Static Analysis Approaches for Detecting Access Control Vulnerabilities in DeFi Smart Contracts', venue: 'Annual Conference of KIPS (ACK) 2025, Nov. 7, 2025', korean: 'DeFi 스마트 컨트랙트 접근 제어 취약점 탐지를 위한 정적 분석 기법' },
              { authors: 'Sunwoo Jeong, Namryeong Kim, Ilgu Lee', title: 'Attention Pattern Analysis for Prompt Injection Detection', venue: 'Annual Conference of KIPS (ACK) 2025, Nov. 7, 2025', korean: '어텐션 패턴 분석 기반 프롬프트 인젝션 탐지 시스템', award: '한국정보기술학술단체총연합회 회장상' },
              { authors: 'Sunwoo Jeong, Namryeong Kim, Hyobeen Cho, Eunseo Youk, Ilgu Lee', title: 'Watermark-based Prompt Injection Threat Analysis', venue: 'Annual Conference of KIPS (ACK) 2025, Nov. 7, 2025', korean: '워터마크 기반 프롬프트 인젝션 위협 분석', award: '동상' },
              { authors: 'Eunseo Youk, Namryeong Kim, Hyobeen Cho, Sunwoo Jeong, Ilgu Lee', title: 'A Static Analysis Framework for Detecting Smart Contract Business Logic Vulnerabilities', venue: 'Annual Conference of KIPS (ACK) 2025, Nov. 7, 2025', korean: '스마트 컨트랙트 비즈니스 로직 취약점 탐지를 위한 정적 분석 프레임워크', award: '국가보안기술연구소 소장상' },
              { authors: 'Hyobeen Cho, Namryeong Kim, Ilgu Lee', title: 'Network-Coding Based Multi-Link Transmission for Inter-Satellite Communications', venue: 'Annual Symposium of KIPS (ASK) 2025, May 31, 2025', korean: '위성 간 통신을 위한 네트워크 코딩 기반 다중 링크 전송' },
              { authors: 'Namryeong Kim, Dongju Ryu, Ilgu Lee', title: 'Method for detecting attack surface in smart contract using code similarity techniques', venue: 'Korea Convergence Security Association 2024 Autumn Conference, Nov. 8, 2024', korean: '코드 유사도 기법을 활용한 스마트 컨트랙트 공격 표면 탐지 방법', award: '최우수논문상' },
              { authors: 'Namryeong Kim, Nara Im, Daehee Jang', title: 'A Study on the analysis of security threats and measures in Metaverse', venue: 'Korea Convergence Security Association 2022 Summer Conference, Jul. 24, 2022', korean: '메타버스 내 보안 위협 분석 및 대책에 관한 연구', award: '장려상' },
              { authors: 'Eunyeong Ahn, Namryeong Kim, Nara Lim, Jisun Kim, Kyungjin Kim, Daehee Jang', title: 'Analysis of Vulnerabilities and Security Measures in OAuth 2.0', venue: 'Conference on Information Security and Cryptography-Summer 2022 (CISC-S\'22), KIISC, 2022', korean: 'OAuth 2.0의 보안 취약점 분석 및 보안 대책 연구' },
              { authors: 'Namryeong Kim, Jiwon Ock (co-first), Seongmin Kim', title: 'Secure de-identification for data privacy with SGX-based Artificial intelligence learning framework', venue: 'The 24th Korea Conference on Software Engineering (KCSE 2022), Jan. 2022', korean: '개인정보보호를 위한 SGX기반 학습데이터 비식별화 인공지능 학습 프레임워크' },
              { authors: 'Eunyoung Lee, Namryeong Kim, Chaerim Han, Ilgu Lee', title: 'Evaluation Framework for Practical Byzantine Fault Tolerant based Consensus Algorithms', venue: 'The 50th Korea Institute of Information and Communication Engineering Conference (KIICE), Oct. 28, 2021', korean: '프랙티컬 비잔틴 장애 허용 기반의 합의 알고리즘의 평가 프레임워크', award: '우수논문상' },
            ].map((pub, index) => (
              <motion.div
                key={index}
                className={`p-4 rounded-xl border ${pub.award ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ }}
                transition={{ delay: index * 0.03 }}
              >
                {pub.award && <span className="inline-block px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded text-xs font-medium mb-2">{pub.award}</span>}
                <p className="text-sm text-violet-600 dark:text-violet-400 mb-1">{pub.authors}</p>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">&ldquo;{pub.title}&rdquo;</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pub.venue}</p>
                {pub.korean && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1"># {pub.korean}</p>}
              </motion.div>
            ))}
          </motion.div>
          )}
          </AnimatePresence>
        </motion.section>

        {/* Honors & Awards */}
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
              { title: 'ICT Convergence Security Crew Best Crew Award', org: 'KISIA', year: '2025', highlight: true },
              { title: 'National Security Technology Research Institute Director Award', org: 'ACK 2025', year: '2025', highlight: true },
              { title: 'Korea Information Technology Association President\'s Award', org: 'ACK 2025', year: '2025', highlight: true },
              { title: 'The Third Prize', org: 'ACK 2025', year: '2025' },
              { title: 'Best Paper Award', org: 'KCSA 2024 Autumn Conference', year: '2024' },
              { title: 'First Prize, Convergence Security Software Competition', org: 'Sungshin Women\'s University', year: '2024' },
              { title: 'First Prize, Protocol Camp 5th', org: 'Dreamplus X HASHED', year: '2024' },
              { title: 'First Prize, Sungshin CSE x I.Sly() CTF', org: '', year: '2023' },
              { title: 'The Third Prize', org: 'KCSA 2022 Summer Conference', year: '2022' },
              { title: 'Excellent Paper Award', org: 'KIICE 50th Conference', year: '2021' },
            ].map((award, index) => (
              <motion.div
                key={index}
                className={`p-4 rounded-xl border ${award.highlight ? 'bg-gradient-to-br from-violet-100/80 to-indigo-100/80 dark:from-violet-900/30 dark:to-indigo-900/30 border-violet-300 dark:border-violet-700' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ }}
                transition={{ delay: index * 0.05 }}
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

        {/* Certificate */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </span>
            Certificate
          </h2>
          <motion.div
            className="p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 inline-block"
            whileHover={{ scale: 1.02 }}
          >
            <p className="font-medium text-gray-900 dark:text-white">Engineer Information Processing (정보처리기사)</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Human Resources Development Service of Korea | 2024.09</p>
          </motion.div>
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
              { title: 'Solidity compiler version automatic detection and installation management program', code: 'C-2025-031742', date: 'Jul. 10, 2025', korean: '솔리디티 컴파일러 버전 자동 탐지 및 설치 관리 프로그램' },
              { title: 'Global lock-based smart contract security module', code: 'C-2025-031743', date: 'Jul. 10, 2025', korean: '글로벌 락 기반 스마트 컨트랙트 보안 모듈' },
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
                <p className="font-medium text-gray-900 dark:text-white mb-1">{patent.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2"># {patent.korean}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-violet-600 dark:text-violet-400 font-mono">{patent.code}</span>
                  <span className="text-xs text-gray-400">| {patent.date}</span>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            Professional Activities
          </h2>

          <div className="space-y-6">
            {/* Club */}
            <div className="p-5 bg-white dark:bg-gray-800/80 rounded-xl border border-violet-100 dark:border-violet-900/50">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">HASH (Hacking Club) - Sungshin Women&apos;s University</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">2021.01 - 2022.12 | 성신여대 융합보안공학과 해킹동아리</p>
              <div className="flex flex-wrap gap-2">
                {['Founding Member', 'Vice President (2021)', 'President (2022)'].map((role, i) => (
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

            {/* External Activities */}
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">External Activities</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { period: '2025.05 - 2025.12', title: 'Convergence Security Crew', org: 'KISIA', role: 'AI Security Team Leader (크루장)', desc: 'DeFi vulnerability detection with LLM & prompt injection prevention' },
                { period: '2023.09 - 2023.12', title: 'Protocol Camp 5th', org: 'Dreamplus X Hashed', role: 'Team Leader (AntiBug)', desc: 'VSCode security assistant for smart contract development' },
                { period: '2023.03 - 2023.06', title: 'DreamPlus Academy 2nd', org: 'Dreamplus X Theori', desc: 'Blockchain security training & static analysis detector development' },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ borderColor: "rgb(139 92 246 / 0.5)" }}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">{activity.period}</span>
                  <h4 className="font-medium text-gray-900 dark:text-white">{activity.title}</h4>
                  <p className="text-violet-600 dark:text-violet-400 text-sm">{activity.org}</p>
                  {activity.role && <p className="text-sm text-indigo-600 dark:text-indigo-400">{activity.role}</p>}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{activity.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* CTF */}
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">CTF</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { event: 'Sungshin CSE x I.Sly() CTF', team: 'Team 역은카와 아이들', rank: '1st', year: '2023' },
                { event: 'Power of XX', team: 'Team HAC', rank: '8th', year: '2021' },
              ].map((ctf, index) => (
                <motion.div
                  key={index}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className={`text-sm font-medium ${ctf.rank === '1st' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {ctf.rank}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm"> @ {ctf.event} ({ctf.year})</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Press */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </span>
            Press
          </h2>
          <div className="space-y-3">
            {[
              { title: '해시드, 실전 블록체인 프로그램 \'프로토콜 캠프\' 5기 성료', date: '2023.12.01' },
              { title: '연구팀, 한국융합보안학회 추계학술대회서 최우수·우수논문상 수상', date: '2024.11.08' },
              { title: '성신여대, 한국정보처리학회 \'ACK2025\'에서 수상', date: '2025.11.10' },
              { title: '성신여대, 4개 대학 연합 연구팀, ICT 융합보안크루 \'최우수\' 크루 선정', date: '2025.12.09' },
            ].map((press, index) => (
              <motion.div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ }}
                transition={{ delay: index * 0.1 }}
              >
                <p className="text-gray-900 dark:text-white text-sm">{press.title}</p>
                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-4">{press.date}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 dark:text-gray-500 pt-8 border-t border-gray-200 dark:border-gray-800">
          Last Updated: 2025.12.09
        </div>
      </div>
    </div>
  );
}
