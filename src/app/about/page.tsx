'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface TimelineItem {
  year: string;
  title: string;
  subtitle: string;
  org: string;
  detail: string;
}

interface ActivityTimelineItem {
  period: string;
  title: string;
  org: string;
  role?: string;
  desc: string;
}

interface ScholarshipItem {
  name: string;
  korean?: string;
  org: string;
  date: string;
}

interface ProjectItem {
  category: string;
  name: string;
  korean?: string;
  description: string;
  link?: string;
  org: string;
}

interface AboutData {
  profile: {
    name: string;
    title: string;
    affiliation: string;
    location: string;
    github: string;
    email: string;
    telegram: string;
    highlightName?: string; // 논문에서 강조할 이름
  };
  bio: {
    quote: string;
    description: string;
  };
  researchInterests: string[];
  inProgress: string[];
  timeline: {
    education: TimelineItem[];
    scholarship: ScholarshipItem[];
    project: ProjectItem[];
    work: TimelineItem[];
    research: TimelineItem[];
    activities: ActivityTimelineItem[];
  };
  publications: {
    journals: Array<{ authors: string; title: string; venue: string; badge: string; featured?: boolean; korean?: string }>;
    international: Array<{ authors: string; title: string; venue: string; badge?: string }>;
    domestic: Array<{ authors: string; title: string; venue: string; korean?: string; award?: string; badge?: string }>;
  };
  awards: Array<{ title: string; org: string; year: string; highlight?: boolean; korean?: string; linkedSection?: string; linkedItem?: string; badge?: string }>;
  certificates: Array<{ title: string; org: string; date: string }>;
  patents: Array<{ title: string; code: string; date: string; korean: string }>;
  activities: {
    club: { name: string; period: string; description: string; roles: string[] };
    external: Array<{ period: string; title: string; org: string; role?: string; desc: string }>;
    ctf: Array<{ event: string; team: string; rank: string; year: string }>;
  };
  press: Array<{ title: string; date: string; source: string; url: string; image: string }>;
  videos: Array<{ title: string; url: string }>;
  lastUpdated: string;
}

export default function AboutPage() {
  const [expandedSections, setExpandedSections] = useState({
    research: true,
    education: true,
    publications: true,
    awards: true,
    certificate: true,
    patents: true,
    press: true,
  });
  const [activeEducationTab, setActiveEducationTab] = useState<'education' | 'scholarship' | 'project'>('education');
  const [activeExperienceTab, setActiveExperienceTab] = useState<'research' | 'work' | 'activities' | 'club'>('research');
  const [activePubTab, setActivePubTab] = useState<'journals' | 'international' | 'domestic'>('journals');
  const [activeAwardsTab, setActiveAwardsTab] = useState<'all' | 'conference' | 'competition' | 'activity'>('all');
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/about')
      .then(res => res.json())
      .then(fetchedData => {
        setData(fetchedData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  // Collapsible section header component
  const SectionHeader = ({
    sectionKey,
    icon,
    title
  }: {
    sectionKey: keyof typeof expandedSections;
    icon: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full text-2xl font-bold mb-6 flex items-center gap-3 group hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
      style={{ color: 'var(--foreground)' }}
    >
      <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-transparent flex items-center justify-center text-accent-violet border border-transparent dark:border-violet-400">
        {icon}
      </span>
      <span className="flex-1 text-left">{title}</span>
      <motion.svg
        className="w-5 h-5 text-gray-400 group-hover:text-violet-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        animate={{ rotate: expandedSections[sectionKey] ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </motion.svg>
    </button>
  );

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper function to highlight author name in publication
  const highlightAuthorName = (authors: string) => {
    const highlightName = data?.profile.highlightName || 'Namryeong Kim';
    if (!authors.includes(highlightName)) return authors;

    const parts = authors.split(highlightName);
    return (
      <>
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="font-bold underline decoration-violet-500">{highlightName}</span>
            )}
          </span>
        ))}
      </>
    );
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
        <div className="absolute inset-0 about-hero-gradient" />

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
              <div className="relative w-40 h-40 rounded-full overflow-hidden ring-4 ring-violet-200 dark:ring-violet-500/40 shadow-xl shadow-violet-500/30 dark:shadow-violet-500/30">
                <Image
                  src="/profile.jpg"
                  alt="Namryeong Kim"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </motion.div>

            <motion.div className="text-center md:text-left flex-1" variants={fadeInUp}>
              <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>{data.profile.name}</h1>
              <p className="text-xl text-accent-violet font-medium mb-2">{data.profile.title}</p>
              <p className="mb-4" style={{ color: 'var(--foreground)' }}>
                {data.profile.affiliation}<br />
                {data.profile.location}
              </p>

              <div className="flex flex-wrap justify-start gap-3">
                <motion.a
                  href={`https://github.com/${data.profile.github}`}
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
                  href={`mailto:${data.profile.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-800 transition-all duration-200 text-sm shadow-sm"
                  whileHover={{ y: -2 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </motion.a>
                <motion.a
                  href={`https://t.me/${data.profile.telegram}`}
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
          <div className="p-6 rounded-2xl border border-violet-200 dark:border-violet-500/30" style={{ background: 'var(--card-bg)' }}>
            <p className="text-lg text-violet-700 dark:text-violet-200 font-medium italic text-center mb-4">
              &ldquo;{data.bio.quote}&rdquo;
            </p>
            <p className="leading-relaxed text-center" style={{ color: 'var(--foreground)' }}>
              {data.bio.description}
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
          <SectionHeader
            sectionKey="research"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
            title="Research Interests"
          />
          <AnimatePresence>
          {expandedSections.research && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
          <div className="flex flex-wrap gap-3 mb-8">
            {data.researchInterests.map((interest, index) => (
              <motion.span
                key={interest}
                className="px-5 py-2.5 about-interest-tag text-violet-400 dark:text-violet-200 rounded-full font-medium border border-violet-200 dark:border-violet-400"
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

          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            In Progress
          </h3>
          <div className="space-y-3">
            {data.inProgress.map((item, index) => (
              <motion.div
                key={index}
                className="p-3 about-progress-item rounded-lg border border-lime-300 dark:border-lime-400 text-lime-600 dark:text-lime-300"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ }}
                transition={{ delay: index * 0.1 }}
              >
                Researching on {item}
              </motion.div>
            ))}
          </div>
          </motion.div>
          )}
          </AnimatePresence>
        </motion.section>

        {/* Education Section - Tabbed Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            sectionKey="education"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            title="Education"
          />
          <AnimatePresence>
          {expandedSections.education && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 about-tab-bar rounded-xl border border-gray-200 dark:border-gray-600">
            {[
              { id: 'education' as const, label: 'Education', icon: '🎓', count: data.timeline.education?.length || 0 },
              { id: 'scholarship' as const, label: 'Scholarship', icon: '🏅', count: data.timeline.scholarship?.length || 0 },
              { id: 'project' as const, label: 'Project', icon: '📂', count: data.timeline.project?.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveEducationTab(tab.id)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeEducationTab === tab.id
                    ? 'about-tab-active text-accent-violet shadow-sm dark:shadow-none border-transparent dark:border dark:border-violet-400'
                    : 'about-tab-inactive hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="text-xs opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Timeline Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeEducationTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {/* Timeline line */}
              <div className={`absolute left-3 top-0 bottom-0 w-0.5 rounded-full ${
                activeEducationTab === 'education'
                  ? 'bg-gradient-to-b from-violet-500 via-indigo-500 to-purple-500'
                  : activeEducationTab === 'scholarship'
                  ? 'bg-gradient-to-b from-amber-500 via-yellow-500 to-orange-500'
                  : 'bg-gradient-to-b from-cyan-500 via-teal-500 to-emerald-500'
              }`} />

              <div className="space-y-4">
                {(() => {
                  // Education tab - TimelineItem[]
                  if (activeEducationTab === 'education') {
                    const items = data.timeline.education || [];
                    if (items.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          아직 등록된 항목이 없습니다.
                        </div>
                      );
                    }
                    return items.map((item, index) => (
                      <motion.div
                        key={index}
                        className="relative pl-8"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center z-10 bg-violet-500">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <motion.div
                          className="p-4 rounded-xl border border-gray-200 dark:border-violet-500/20 shadow-sm hover:shadow-md transition-all"
                          style={{ background: 'var(--card-bg)' }}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-violet-100 dark:bg-transparent text-violet-700 dark:text-violet-200 border-violet-200 dark:border-violet-400">
                              {item.year}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold card-title">{item.title}</h3>
                          <p className="text-accent-violet font-medium text-sm">{item.subtitle}</p>
                          {item.org && <p className="text-gray-600 dark:text-gray-400 text-sm">{item.org}</p>}
                          {item.detail && <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">{item.detail}</p>}
                        </motion.div>
                      </motion.div>
                    ));
                  }

                  // Scholarship tab - ScholarshipItem[] (name, org, date) - Grouped by year
                  if (activeEducationTab === 'scholarship') {
                    const items = data.timeline.scholarship || [];
                    if (items.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          아직 등록된 항목이 없습니다.
                        </div>
                      );
                    }
                    // Group by year (extract year from date like "2025.09" -> "2025")
                    const groupedByYear = items.reduce((acc, item) => {
                      const year = item.date.split('.')[0];
                      if (!acc[year]) acc[year] = [];
                      acc[year].push(item);
                      return acc;
                    }, {} as Record<string, typeof items>);
                    const sortedYears = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

                    return sortedYears.map((year, yearIndex) => (
                      <motion.div
                        key={year}
                        className="relative pl-8"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: yearIndex * 0.1 }}
                      >
                        <div className="absolute left-0 top-3 w-6 h-6 rounded-full flex items-center justify-center z-10 bg-amber-500">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <div className="p-3 rounded-xl border border-gray-200 dark:border-violet-500/20" style={{ background: 'var(--card-bg)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-amber-100 dark:bg-transparent text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-400">
                              {year}
                            </span>
                            <span className="text-xs text-gray-400">({groupedByYear[year].length})</span>
                          </div>
                          <div className="space-y-2">
                            {groupedByYear[year].map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                <span className="text-xs text-gray-400 dark:text-gray-500 min-w-[45px]">{item.date.split('.')[1]}월</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium card-title truncate">{item.name}</p>
                                  {item.korean && <p className="text-xs text-gray-400 dark:text-gray-500"># {item.korean}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ));
                  }

                  // Project tab - ProjectItem[] (category, name, description, link, org)
                  const items = data.timeline.project || [];
                  if (items.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        아직 등록된 항목이 없습니다.
                      </div>
                    );
                  }
                  return items.map((item, index) => (
                    <motion.div
                      key={index}
                      className="relative pl-8"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center z-10 bg-cyan-500">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <motion.div
                        className="p-4 rounded-xl border border-gray-200 dark:border-violet-500/20 shadow-sm hover:shadow-md transition-all"
                        style={{ background: 'var(--card-bg)' }}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-cyan-100 dark:bg-transparent text-cyan-700 dark:text-cyan-200 border-cyan-200 dark:border-cyan-400">
                            {item.category}
                          </span>
                          {item.org && (
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {item.org}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold card-title">{item.name}</h3>
                        {item.korean && <p className="text-gray-500 dark:text-gray-400 text-sm"># {item.korean}</p>}
                        {item.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 whitespace-pre-line">{item.description}</p>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-3 text-sm text-accent-violet hover:underline"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Link
                          </a>
                        )}
                      </motion.div>
                    </motion.div>
                  ));
                })()}
              </div>
            </motion.div>
          </AnimatePresence>
          </motion.div>
          )}
          </AnimatePresence>
        </motion.section>

        {/* Experience Section - Tabbed Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            sectionKey="education"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            title="Experience"
          />
          <AnimatePresence>
          {expandedSections.education && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 about-tab-bar rounded-xl border border-gray-200 dark:border-gray-600">
            {[
              { id: 'research' as const, label: 'Research', icon: '🔬', count: data.timeline.research?.length || 0 },
              { id: 'work' as const, label: 'Work', icon: '💼', count: data.timeline.work?.length || 0 },
              { id: 'activities' as const, label: 'Activities', icon: '🎯', count: data.timeline.activities?.length || 0 },
              { id: 'club' as const, label: 'Club & CTF', icon: '🏆', count: data.activities.ctf?.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveExperienceTab(tab.id)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeExperienceTab === tab.id
                    ? 'about-tab-active text-accent-violet shadow-sm dark:shadow-none border-transparent dark:border dark:border-violet-400'
                    : 'about-tab-inactive hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="text-xs opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Timeline Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeExperienceTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {/* Timeline line */}
              <div className={`absolute left-3 top-0 bottom-0 w-0.5 rounded-full ${
                activeExperienceTab === 'research'
                  ? 'bg-gradient-to-b from-indigo-500 via-blue-500 to-cyan-500'
                  : activeExperienceTab === 'work'
                  ? 'bg-gradient-to-b from-emerald-500 via-teal-500 to-green-500'
                  : activeExperienceTab === 'club'
                  ? 'bg-gradient-to-b from-violet-500 via-orange-400 to-amber-500'
                  : 'bg-gradient-to-b from-purple-500 via-pink-500 to-rose-500'
              }`} />

              <div className="space-y-4">
                {(() => {
                  // Handle activities tab separately with different structure
                  if (activeExperienceTab === 'activities') {
                    const activityItems = data.timeline.activities || [];
                    if (activityItems.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          아직 등록된 항목이 없습니다.
                        </div>
                      );
                    }
                    return activityItems.map((item, index) => (
                      <motion.div
                        key={index}
                        className="relative pl-8"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center z-10 bg-purple-500">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <motion.div
                          className="p-4 rounded-xl border border-gray-200 dark:border-violet-500/20 shadow-sm hover:shadow-md transition-all"
                          style={{ background: 'var(--card-bg)' }}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-purple-100 dark:bg-transparent text-purple-700 dark:text-purple-200 border-purple-200 dark:border-purple-400">
                              {item.period}
                            </span>
                            {item.role && (
                              <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {item.role}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold card-title">{item.title}</h3>
                          <p className="text-accent-violet font-medium text-sm">{item.org}</p>
                          {item.desc && <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{item.desc}</p>}
                        </motion.div>
                      </motion.div>
                    ));
                  }

                  // Handle club tab - Club info and CTF list
                  if (activeExperienceTab === 'club') {
                    return (
                      <div className="space-y-6 pl-8">
                        {/* Club Section */}
                        <motion.div
                          className="relative"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="absolute -left-8 top-3 w-6 h-6 rounded-full flex items-center justify-center z-10 bg-violet-500">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                          <div className="p-4 rounded-xl border border-violet-200 dark:border-violet-500/30" style={{ background: 'var(--card-bg)' }}>
                            <h4 className="font-semibold card-title text-lg mb-2">{data.activities.club.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{data.activities.club.period} | {data.activities.club.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {data.activities.club.roles.map((role, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 bg-violet-100 dark:bg-transparent text-violet-700 dark:text-violet-200 rounded-full text-xs border border-violet-200 dark:border-violet-400"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>

                        {/* CTF Section */}
                        <motion.div
                          className="relative"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          <div className="absolute -left-8 top-3 w-6 h-6 rounded-full flex items-center justify-center z-10 bg-orange-500">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                          <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-500/30" style={{ background: 'var(--card-bg)' }}>
                            <h4 className="font-semibold card-title text-lg mb-3">CTF Competitions</h4>
                            <div className="space-y-2">
                              {data.activities.ctf.map((ctf, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    ctf.rank === '1st'
                                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                  }`}>
                                    {ctf.rank}
                                  </span>
                                  <span className="text-sm card-title">{ctf.event}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">({ctf.year})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  }

                  // Handle research and work tabs with TimelineItem structure
                  const filteredItems = data.timeline[activeExperienceTab as 'research' | 'work'] || [];

                  if (filteredItems.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        아직 등록된 항목이 없습니다.
                      </div>
                    );
                  }

                  return filteredItems.map((item, index) => (
                    <motion.div
                      key={index}
                      className="relative pl-8"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                        activeExperienceTab === 'research'
                          ? 'bg-indigo-500'
                          : 'bg-emerald-500'
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>

                      {/* Content Card */}
                      <motion.div
                        className="p-4 rounded-xl border border-gray-200 dark:border-violet-500/20 shadow-sm hover:shadow-md transition-all"
                        style={{ background: 'var(--card-bg)' }}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            activeExperienceTab === 'research'
                              ? 'bg-indigo-100 dark:bg-transparent text-indigo-700 dark:text-indigo-200 border-indigo-200 dark:border-indigo-400'
                              : 'bg-emerald-100 dark:bg-transparent text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-400'
                          }`}>
                            {item.year}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold card-title">{item.title}</h3>
                        <p className="text-accent-violet font-medium text-sm">{item.subtitle}</p>
                        {item.org && <p className="text-gray-600 dark:text-gray-400 text-sm">{item.org}</p>}
                        {item.detail && <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">{item.detail}</p>}
                      </motion.div>
                    </motion.div>
                  ));
                })()}
              </div>
            </motion.div>
          </AnimatePresence>
          </motion.div>
          )}
          </AnimatePresence>
        </motion.section>

        {/* Publications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            sectionKey="publications"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            title="Publications"
          />
          <AnimatePresence>
          {expandedSections.publications && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 about-tab-bar rounded-xl border border-gray-200 dark:border-gray-600">
            {[
              { id: 'journals' as const, label: 'Journals', icon: '📚', count: data.publications.journals.length },
              { id: 'international' as const, label: 'International', icon: '🌍', count: data.publications.international.length },
              { id: 'domestic' as const, label: 'Domestic', icon: '🇰🇷', count: data.publications.domestic.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePubTab(tab.id)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  activePubTab === tab.id
                    ? 'about-tab-active text-accent-violet shadow-sm dark:shadow-none border-transparent dark:border dark:border-violet-400'
                    : 'about-tab-inactive hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="text-xs opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Publications Content with Timeline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePubTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {/* Timeline line */}
              <div className={`absolute left-3 top-0 bottom-0 w-0.5 rounded-full ${
                activePubTab === 'journals'
                  ? 'bg-gradient-to-b from-violet-500 via-indigo-500 to-purple-500'
                  : activePubTab === 'international'
                  ? 'bg-gradient-to-b from-blue-500 via-cyan-500 to-teal-500'
                  : 'bg-gradient-to-b from-amber-500 via-orange-500 to-red-500'
              }`} />

              <div className="space-y-4">
              {(() => {
                const getDotColor = () => {
                  if (activePubTab === 'journals') return 'bg-violet-500';
                  if (activePubTab === 'international') return 'bg-blue-500';
                  return 'bg-amber-500';
                };

                if (activePubTab === 'journals') {
                  return data.publications.journals.map((pub, index) => (
                    <motion.div
                      key={index}
                      className="relative pl-8"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center z-10 ${getDotColor()}`}>
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <motion.div
                        className={`p-5 rounded-xl border ${pub.featured ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/30' : 'border-gray-200 dark:border-gray-700/50'}`}
                        style={{ background: pub.featured ? undefined : 'var(--card-bg)' }}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex flex-wrap gap-2 mb-2">
                          {pub.badge.split(',').map((b, i) => (
                            <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium ${pub.featured ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'}`}>{b.trim()}</span>
                          ))}
                        </div>
                        <p className="text-sm text-accent-violet mb-1">{highlightAuthorName(pub.authors)}</p>
                        <h4 className={`font-medium mb-1 ${pub.featured ? 'text-gray-900' : 'pub-card-title'}`}>&ldquo;{pub.title}&rdquo;</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{pub.venue}</p>
                        {pub.korean && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1"># {pub.korean}</p>}
                      </motion.div>
                    </motion.div>
                  ));
                }

                if (activePubTab === 'international') {
                  return data.publications.international.map((pub, index) => (
                    <motion.div
                      key={index}
                      className="relative pl-8"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center z-10 ${getDotColor()}`}>
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <motion.div
                        className="p-4 rounded-xl border border-gray-200 dark:border-gray-700/50"
                        style={{ background: 'var(--card-bg)' }}
                        whileHover={{ x: 4 }}
                      >
                        {pub.badge && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {pub.badge.split(',').map((b, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">{b.trim()}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-accent-violet mb-1">{highlightAuthorName(pub.authors)}</p>
                        <h4 className="font-medium pub-card-title text-sm">&ldquo;{pub.title}&rdquo;</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pub.venue}</p>
                      </motion.div>
                    </motion.div>
                  ));
                }

                return data.publications.domestic.map((pub, index) => (
                  <motion.div
                    key={index}
                    className="relative pl-8"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center z-10 ${pub.award ? 'bg-amber-500' : getDotColor()}`}>
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <motion.div
                      className={`p-4 rounded-xl border ${pub.award ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30' : 'border-gray-200 dark:border-gray-700/50'}`}
                      style={{ background: pub.award ? undefined : 'var(--card-bg)' }}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex flex-wrap gap-2 mb-2">
                        {pub.badge && pub.badge.split(',').map((b, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">{b.trim()}</span>
                        ))}
                        {pub.award && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded text-xs font-medium">{pub.award}</span>}
                      </div>
                      <p className="text-sm text-accent-violet mb-1">{highlightAuthorName(pub.authors)}</p>
                      <h4 className={`font-medium text-sm ${pub.award ? 'text-gray-900' : 'pub-card-title'}`}>&ldquo;{pub.title}&rdquo;</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pub.venue}</p>
                      {pub.korean && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1"># {pub.korean}</p>}
                    </motion.div>
                  </motion.div>
                ));
              })()}
              </div>
            </motion.div>
          </AnimatePresence>
          </motion.div>
          )}
          </AnimatePresence>
        </motion.section>

        {/* Honors & Awards - Timeline Format */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            sectionKey="awards"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
            title="Honors & Awards"
          />
          <AnimatePresence>
          {expandedSections.awards && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 p-1 about-tab-bar rounded-xl border border-gray-200 dark:border-gray-600">
            {[
              { id: 'all' as const, label: 'All', icon: '🏆', count: data.awards.length },
              { id: 'conference' as const, label: 'Conference', icon: '📄', count: data.awards.filter(a => a.linkedSection === 'conference').length },
              { id: 'competition' as const, label: 'Competition', icon: '🥇', count: data.awards.filter(a => a.linkedSection === 'competition').length },
              { id: 'activity' as const, label: 'Activity', icon: '🎯', count: data.awards.filter(a => a.linkedSection === 'activity').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveAwardsTab(tab.id)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeAwardsTab === tab.id
                    ? 'about-tab-active text-accent-violet shadow-sm dark:shadow-none border-transparent dark:border dark:border-violet-400'
                    : 'about-tab-inactive hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="text-xs opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Timeline Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAwardsTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {/* Timeline line */}
              <div className="absolute left-3 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-amber-500 via-yellow-500 to-orange-500" />

              <div className="space-y-4">
                {(() => {
                  const filteredAwards = activeAwardsTab === 'all'
                    ? data.awards
                    : activeAwardsTab === 'conference'
                    ? data.awards.filter(a => a.linkedSection === 'conference')
                    : activeAwardsTab === 'competition'
                    ? data.awards.filter(a => a.linkedSection === 'competition')
                    : data.awards.filter(a => a.linkedSection === 'activity');

                  if (filteredAwards.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        해당 카테고리에 등록된 수상이 없습니다.
                      </div>
                    );
                  }

                  return filteredAwards.map((award, index) => (
                    <motion.div
                      key={index}
                      className="relative pl-8"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                        award.highlight ? 'bg-amber-500' : 'bg-yellow-500'
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>

                      {/* Content Card */}
                      <motion.div
                        className={`p-4 rounded-xl border ${
                          award.highlight
                            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30'
                            : 'border-gray-200 dark:border-gray-700/50'
                        }`}
                        style={{ background: award.highlight ? undefined : 'var(--card-bg)' }}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            award.highlight
                              ? 'bg-amber-100 dark:bg-transparent text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-400'
                              : 'bg-yellow-100 dark:bg-transparent text-yellow-700 dark:text-yellow-200 border-yellow-200 dark:border-yellow-400'
                          }`}>
                            {award.year}
                          </span>
                          {award.badge && award.badge.split(',').map((b, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-xs bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
                              {b.trim()}
                            </span>
                          ))}
                          {award.linkedSection && (
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {award.linkedSection === 'conference' ? '📄 Conference' :
                               award.linkedSection === 'competition' ? '🥇 Competition' :
                               '🎯 Activity'}
                            </span>
                          )}
                        </div>
                        <h3 className={`font-medium ${award.highlight ? 'text-gray-900 dark:text-white' : 'card-title'}`}>
                          {award.title}
                        </h3>
                        {award.korean && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1"># {award.korean}</p>
                        )}
                        {award.org && (
                          <p className="text-sm text-accent-violet mt-1">{award.org}</p>
                        )}
                      </motion.div>
                    </motion.div>
                  ));
                })()}
              </div>
            </motion.div>
          </AnimatePresence>
          </motion.div>
          )}
          </AnimatePresence>
        </motion.section>

        {/* Certificate */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            sectionKey="certificate"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
            title="Certificate"
          />
          <AnimatePresence>
          {expandedSections.certificate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
          <div className="flex flex-wrap gap-4">
            {data.certificates.map((cert, index) => (
              <motion.div
                key={index}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700/50"
                style={{ background: 'var(--card-bg)' }}
                whileHover={{ scale: 1.02 }}
              >
                <p className="font-medium card-title">{cert.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{cert.org} | {cert.date}</p>
              </motion.div>
            ))}
          </div>
          </motion.div>
          )}
          </AnimatePresence>
        </motion.section>

        {/* Patents */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            sectionKey="patents"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            title="Patents (Code Copyright)"
          />
          <AnimatePresence>
          {expandedSections.patents && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
          <div className="grid md:grid-cols-2 gap-4">
            {data.patents.map((patent, index) => (
              <motion.div
                key={index}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700/50"
                style={{ background: 'var(--card-bg)' }}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ }}
                transition={{ duration: 0.4 }}
                whileHover={{ borderColor: "rgb(139 92 246 / 0.5)" }}
              >
                <p className="font-medium card-title mb-1">{patent.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2"># {patent.korean}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-accent-violet font-mono">{patent.code}</span>
                  <span className="text-xs text-gray-400">| {patent.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
          </motion.div>
          )}
          </AnimatePresence>
        </motion.section>

        {/* Press */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            sectionKey="press"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}
            title="Press"
          />
          <AnimatePresence>
          {expandedSections.press && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
          <div className="grid md:grid-cols-2 gap-4">
            {data.press.map((press, index) => (
              <motion.a
                key={index}
                href={press.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden hover:border-violet-400 dark:hover:border-violet-500 transition-all hover:shadow-lg group"
                style={{ background: 'var(--card-bg)' }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                {/* Thumbnail */}
                <div className="h-44 relative overflow-hidden bg-gradient-to-br from-violet-100 via-indigo-50 to-purple-100 dark:from-violet-900/30 dark:via-indigo-900/20 dark:to-purple-900/30">
                  {press.image ? (
                    <Image
                      src={press.image}
                      alt={press.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-2 left-2 w-16 h-16 rounded-full bg-violet-500 blur-2xl" />
                        <div className="absolute bottom-2 right-2 w-20 h-20 rounded-full bg-indigo-500 blur-2xl" />
                      </div>
                      <svg className="w-12 h-12 text-violet-400 dark:text-violet-500 opacity-60 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="p-4">
                  <p className="card-title text-sm font-medium line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{press.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-accent-violet font-medium">{press.source}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{press.date}</span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Video Embeds */}
          {data.videos && data.videos.length > 0 && (
            <>
              <h3 className="text-lg font-semibold section-subtitle mt-8 mb-4">Videos</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {data.videos.map((video, index) => (
                  <motion.div
                    key={index}
                    className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={video.url}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="border-0"
                      />
                    </div>
                    <div className="p-3" style={{ background: 'var(--card-bg)' }}>
                      <p className="text-sm card-title">{video.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
          </motion.div>
          )}
          </AnimatePresence>
        </motion.section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 dark:text-gray-500 pt-8 border-t border-gray-200 dark:border-gray-800">
          Last Updated: {data.lastUpdated || '...'}
        </div>
      </div>
    </div>
  );
}
