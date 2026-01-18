import Link from 'next/link';

export const metadata = {
  title: 'About | func(sikk)',
  description: 'Namryeong Kim - Security Researcher & M.S. Candidate',
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        About
      </h1>

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 dark:border-pink-900/30 p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-4xl font-bold shrink-0">
            NK
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Namryeong Kim
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              M.S. Candidate in Convergence Security Engineering
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sungshin Women&apos;s University, Prime #603
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <a
                href="https://github.com/siksum"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </a>
              <a
                href="mailto:namyoung0718@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
              <a
                href="https://t.me/siksum"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 dark:border-pink-900/30 p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">👋</span> Introduction
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          &ldquo;올바른 가치관과 신념을 가지고 나눔을 실천하는 현명한 사람&rdquo;이 되고자 합니다.
          맡은 일에 책임감을 가지고 임하며, 다양한 시도를 즐깁니다.
          &ldquo;나눔으로 커지는 지식&rdquo;을 믿으며, 지식과 경험을 나누는 것에서 보람을 느낍니다.
          보안 분야의 전문 지식을 공유하여 더 많은 사람들이 쉽게 접근하고 관심을 가질 수 있도록 돕는 것이 목표입니다.
        </p>
      </div>

      {/* Research Interests */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 dark:border-pink-900/30 p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🔬</span> Research Interests
        </h3>
        <div className="flex flex-wrap gap-3">
          <span className="px-4 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg">Web3 Security</span>
          <span className="px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-lg">Automated Vulnerability Detection</span>
          <span className="px-4 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg">AI Security</span>
        </div>
      </div>

      {/* Education */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 dark:border-pink-900/30 p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">🎓</span> Education
        </h3>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-2 h-2 mt-2 rounded-full bg-pink-500 shrink-0"></div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">M.S. Candidate</p>
              <p className="text-gray-600 dark:text-gray-400">Convergence Security Engineering, Sungshin Women&apos;s University</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">2024.09 – Current | Advisor: Ilgu Lee | GPA: 4.5/4.5</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-2 h-2 mt-2 rounded-full bg-gray-400 shrink-0"></div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">B.S.</p>
              <p className="text-gray-600 dark:text-gray-400">Convergence Security Engineering, Sungshin Women&apos;s University</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">2019.03 – 2023.02 | GPA: 4.33/4.5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Research Experience */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 dark:border-pink-900/30 p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">🔍</span> Research Experience
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-semibold text-gray-900 dark:text-white">Undergraduate Internship @ Pwnlab</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2022.03 – 2023.01 | Advisor: Daehee Jang</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-semibold text-gray-900 dark:text-white">Undergraduate Internship @ NSSec</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2022.01 – 2022.02 | Advisor: Sungmin Kim</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-semibold text-gray-900 dark:text-white">Undergraduate Internship @ CSE Lab</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2021.03 – 2021.12 | Advisor: Ilgu Lee</p>
          </div>
        </div>
      </div>

      {/* Publications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 dark:border-pink-900/30 p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">📄</span> Selected Publications
        </h3>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Journals</h4>
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg border-l-4 border-pink-500">
            <p className="font-medium text-gray-900 dark:text-white">&ldquo;rPBFT: Reliable Practical Byzantine Fault Tolerance Mechanism for Faulty Distributed Networks&rdquo;</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">IEEE Transactions on Big Data (2025) | Co-first author</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">Access-control vulnerability detection in DeFi smart contracts</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Korea Institute of Information Security & Cryptology (Dec 2025)</p>
          </div>
        </div>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Conferences</h4>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-gray-900 dark:text-white">DeFi smart contract security via LangChain and RAG</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">WISA 2025</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-gray-900 dark:text-white">Fault-tolerant consensus mechanisms for blockchain</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">IEEE Consumer Technology – Pacific 2025</p>
          </div>
        </div>
      </div>

      {/* Honors and Awards */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 dark:border-pink-900/30 p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">🏆</span> Honors & Awards
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800/50">
            <p className="font-medium text-gray-900 dark:text-white">ICT Convergence Security Crew Best Crew Award</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2025</p>
          </div>
          <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800/50">
            <p className="font-medium text-gray-900 dark:text-white">National Security Technology Research Institute Director Award</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2025</p>
          </div>
          <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800/50">
            <p className="font-medium text-gray-900 dark:text-white">Korea Information Technology Association President&apos;s Award</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2025</p>
          </div>
          <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800/50">
            <p className="font-medium text-gray-900 dark:text-white">Best Paper Award</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Korea Convergence Security Association, 2024</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">First Prize, Convergence Security Creative Software Competition</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2024</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">First Prize, Protocol Camp 5th</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2024</p>
          </div>
        </div>
      </div>

      {/* Professional Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 dark:border-pink-900/30 p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">💼</span> Professional Activities
        </h3>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Club Leadership - HASH (Hacking Club)</h4>
        <div className="flex flex-wrap gap-3 mb-6">
          <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-sm">Founding Member (2021)</span>
          <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-sm">Vice President (2021)</span>
          <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-sm">President (2022)</span>
        </div>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">External Programs</h4>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">Convergence Security Crew - AI Security Team Leader</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2025.05 – 2025.12 | DeFi vulnerability detection & LLM prompt injection prevention</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">Protocol Camp 5th - Team Leader (AntiBug)</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2023.09 – 2023.12 | VSCode security assistant for smart contract analysis</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">DreamPlus Academy 2nd</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2023.03 – 2023.06 | Blockchain security training & static analysis detector development</p>
          </div>
        </div>
      </div>

      {/* Patents */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 dark:border-pink-900/30 p-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">📜</span> Patents (Code Copyright)
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">Solidity compiler version automatic detection and installation management program</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">C-2025-031742</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">Global lock-based smart contract security module</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">C-2025-031743</p>
          </div>
        </div>
      </div>
    </div>
  );
}
