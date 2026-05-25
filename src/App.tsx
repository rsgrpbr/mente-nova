/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useAppState } from "./hooks/useAppState";
import DiaryTab from "./components/DiaryTab";
import VisionBoardTab from "./components/VisionBoardTab";
import PlayerTab from "./components/PlayerTab";
import { BookOpen, Image as ImageIcon, Waves, Info, RefreshCw, Compass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Bottom navbar tab states
  const [activeTab, setActiveTab] = useState<"diary" | "vision" | "player">("player");
  const [showGuidelineModal, setShowGuidelineModal] = useState<boolean>(false);

  // Load custom state persistence hook and helpers
  const {
    state,
    devModeOverride,
    setDevModeOverride,
    updateDeconstruction,
    updateNewDestiny,
    addVisionItem,
    removeVisionItem,
    addIntercept,
    removeIntercept,
    completeMeditation,
    setCurrentWeekManual,
    resetToDefaults,
  } = useAppState();

  return (
    <div id="app-root-container" className="min-h-screen bg-nature-bg text-zinc-200 flex flex-col font-sans selection:bg-gold selection:text-nature-bg">
      
      {/* Top Premium Brand Header */}
      <header className="border-b border-nature-border bg-nature-card/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gold-dark to-gold flex items-center justify-center shadow-lg shadow-gold/10">
              <Waves className="w-5 h-5 text-nature-bg animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg font-bold tracking-tight text-gold">Mente Nova</h1>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-nature-inner border border-nature-border text-gold px-1.5 py-0.5 rounded-full">
                  Joe Dispenza Método
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 tracking-wide">Desconstruindo o Velho Eu • Criando o Novo Destino</p>
            </div>
          </div>

          {/* Action buttons on utility bar */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            
            {/* Guide trigger */}
            <button
              onClick={() => setShowGuidelineModal(true)}
              className="px-3 py-1.5 bg-nature-inner hover:bg-nature-inner/80 border border-nature-border rounded-lg text-xs font-medium text-gold hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              title="Ver resumo conceitual das 4 semanas"
            >
              <Info className="w-3.5 h-3.5 text-gold" />
              <span>Conceito</span>
            </button>

            {/* Redefine status to initial value */}
            <button
              onClick={resetToDefaults}
              className="p-2 bg-nature-inner hover:bg-nature-inner/80 text-zinc-500 hover:text-red-400 border border-nature-border rounded-lg transition-colors cursor-pointer"
              title="Redefinir aplicativo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>
      </header>

      {/* Main Body view wrap */}
      <main
        className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6 min-h-0"
        style={{ paddingBottom: "var(--bottom-nav-clearance)" }}
      >
        
        {/* Content routing based on active bottom navigation tab */}
        <div className="bg-nature-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "diary" && (
                <DiaryTab
                  state={state}
                  updateDeconstruction={updateDeconstruction}
                  updateNewDestiny={updateNewDestiny}
                />
              )}

              {activeTab === "vision" && (
                <VisionBoardTab
                  state={state}
                  addVisionItem={addVisionItem}
                  removeVisionItem={removeVisionItem}
                />
              )}

              {activeTab === "player" && (
                <PlayerTab
                  state={state}
                  completeMeditation={completeMeditation}
                  addIntercept={addIntercept}
                  removeIntercept={removeIntercept}
                  setCurrentWeekManual={setCurrentWeekManual}
                  devModeOverride={devModeOverride}
                  setDevModeOverride={setDevModeOverride}
                  onOpenDiary={() => setActiveTab("diary")}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Persistent Bottom Navigation Tab bar (Prism aesthetics) */}
      <nav
        className="fixed bottom-0 inset-x-0 bg-nature-card/95 backdrop-blur-md border-t border-nature-border pt-3 px-6 z-30 shadow-2xl"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          
          {/* Tab 1: Diario */}
          <button
            onClick={() => setActiveTab("diary")}
            className={`flex flex-col items-center gap-1 relative cursor-pointer group px-3 ${
              activeTab === "diary" ? "text-gold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === "diary" ? "bg-gold/15" : "bg-transparent"}`}>
              <BookOpen className="w-5 h-5 transition-transform group-hover:scale-105" />
            </div>
            <span className="text-[10px] font-medium tracking-wide">Diário Escrito</span>
            {activeTab === "diary" && (
              <motion.div layoutId="bottom-indicator" className="absolute -bottom-1 w-5 h-1 bg-gold rounded-full" />
            )}
          </button>

          {/* Tab 2: Player (Central core screen focus) */}
          <button
            onClick={() => setActiveTab("player")}
            className={`flex flex-col items-center gap-1 relative cursor-pointer group px-3 ${
              activeTab === "player" ? "text-gold font-semibold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === "player" ? "bg-gold/20" : "bg-transparent"}`}>
              <Waves className="w-6 h-6 transition-transform group-hover:scale-105" />
            </div>
            <span className="text-[10px] font-bold tracking-wide">Meditação e Player</span>
            {activeTab === "player" && (
              <motion.div layoutId="bottom-indicator" className="absolute -bottom-1 w-6 h-1 bg-gold rounded-full" />
            )}
          </button>

          {/* Tab 3: Vision Board */}
          <button
            onClick={() => setActiveTab("vision")}
            className={`flex flex-col items-center gap-1 relative cursor-pointer group px-3 ${
              activeTab === "vision" ? "text-gold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === "vision" ? "bg-gold/15" : "bg-transparent relative"}`}>
              <ImageIcon className="w-5 h-5 transition-transform group-hover:scale-105" />
              {state.visionBoard.length > 0 && (
                <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-gold animate-pulse"></div>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-wide">Vision Board</span>
            {activeTab === "vision" && (
              <motion.div layoutId="bottom-indicator" className="absolute -bottom-1 w-5 h-1 bg-gold rounded-full" />
            )}
          </button>

        </div>
      </nav>

      {/* Information guideline Modal (Passo a passo das 4 semanas de Joe Dispenza) */}
      <AnimatePresence>
        {showGuidelineModal && (
          <div className="fixed inset-0 bg-nature-bg/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-nature-card border border-nature-border p-6 rounded-2xl max-w-xl w-full space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-nature-border pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="text-gold w-5 h-5" />
                  <h3 className="font-serif text-lg font-semibold text-gold">Guia Metodológico de Prática</h3>
                </div>
                <button
                  onClick={() => setShowGuidelineModal(false)}
                  className="p-1 text-zinc-500 hover:text-white rounded-lg"
                >
                  <RefreshCw className="w-5 h-5 transform rotate-45 text-gold" />
                </button>
              </div>

              {/* Weeks program details scroll */}
              <div className="space-y-4 text-xs text-zinc-350 leading-relaxed">
                <p>
                  O aplicativo segue fielmente o roteiro neural ensinado pelo Dr. Joe Dispenza no livro <strong>"Quebrando o Hábito de Ser Você Mesmo"</strong>. Ele é dividido em uma rotina sequencial para reconstruir estados de ser:
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-nature-inner border border-nature-border rounded-lg">
                    <p className="font-bold text-gold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gold"></span>
                      Semana 1: A Indução Corpórea (Acústica)
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Músculos relaxados e foco integral no espaço vazio. O objetivo é acalmar o cérebro em repouso e preparar os canais neurossensores para a deconstrução e relaxamento.
                    </p>
                  </div>

                  <div className="p-3 bg-nature-inner border border-nature-border rounded-lg">
                    <p className="font-bold text-gold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gold-dark"></span>
                      Semana 2: Reconhecer, Admitir e Entregar
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Encontrar a emoção limitante consolidada (ex: ira, culpa, inveja). Escreva no diário e admita em meditação, soltando-a para o campo de infinitas possibilidades de cura.
                    </p>
                  </div>

                  <div className="p-3 bg-nature-inner border border-nature-border rounded-lg">
                    <p className="font-bold text-gold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gold"></span>
                      Semana 3: Observation e Interceptação Neutra
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      No dia a dia, observe-se caindo de volta nas reatividades. Use o botão <strong>"MUDE!"</strong> no aplicativo para interceptar as cadeias e registrar sua vitória biológica.
                    </p>
                  </div>

                  <div className="p-3 bg-nature-inner border border-nature-border rounded-lg">
                    <p className="font-bold text-gold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gold"></span>
                      Semana 4: Criação e Ensaio Mental do Novo Destino
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Altere sua assinatura eletromagnética. Pratique visualizar no painel de imagens e responda aos 3 pilares do diário criativo: Como eu quero <strong>Pensar</strong>, <strong>Agir</strong> e <strong>Sentir</strong> hoje.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-gold/10 border border-gold/20 rounded-lg text-[11px] text-gold">
                  <strong>Conselho Científico:</strong> A transformação profunda exige consistência diária. De acordo com o livro, pratique a meditação da sua semana correspondente ao menos 7 dias consecutivos antes de avançar para a próxima etapa.
                </div>
              </div>

              <div className="border-t border-nature-border pt-3 flex justify-end">
                <button
                  onClick={() => setShowGuidelineModal(false)}
                  className="px-4 py-2 bg-gold hover:bg-gold-dark text-nature-bg rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Entendi e Quero Praticar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
