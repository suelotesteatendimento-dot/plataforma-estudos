import Link from "next/link";
import type { CSSProperties } from "react";
import {
  BookOpen,
  Sparkles,
  Dumbbell,
  GraduationCap,
  Layers,
  CalendarDays,
  Flame,
  CheckCircle2,
  ArrowRight,
  Brain,
  Target,
  TrendingUp,
  ChevronDown,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimateIn } from "@/components/landing/animate-in";

// Hero entrance: CSS animation, sem IntersectionObserver (já está na viewport)
function ha(delay: number): CSSProperties {
  return { animation: `land-fade-up 0.6s ease-out ${delay}ms both` };
}

// ── Feature card ────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group rounded-2xl border bg-card p-6 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-base mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// ── Step card ───────────────────────────────────────────────────────────────

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="pt-1">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ── FAQ item ────────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-sm select-none hover:bg-accent/50 transition-colors list-none">
        {question}
        <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
        {answer}
      </div>
    </details>
  );
}

// ── Stat pill ───────────────────────────────────────────────────────────────

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <p className="font-bold text-sm">Estudo+</p>
              <p className="text-[10px] text-muted-foreground">Plataforma IA</p>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">
              Como funciona
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Começar agora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div
          style={ha(0)}
          className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Powered by IA · Groq llama-3.3-70b
        </div>

        <h1
          style={ha(80)}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto"
        >
          Estude de forma{" "}
          <span className="text-primary">mais inteligente</span>,
          não mais difícil
        </h1>

        <p
          style={ha(160)}
          className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
        >
          Exercícios gerados por IA, correção automática, flashcards, simulados
          e agenda de estudos — tudo em um só lugar.
        </p>

        <div
          style={ha(240)}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/register">
            <Button size="lg" className="gap-2 text-base px-6">
              Criar conta grátis
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-base px-6">
              Já tenho conta
            </Button>
          </Link>
        </div>

        <p style={ha(300)} className="mt-4 text-xs text-muted-foreground">
          Cadastro por convite · Sem cartão de crédito
        </p>

        <div
          style={ha(380)}
          className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto border rounded-2xl bg-card p-6"
        >
          <StatPill value="IA" label="Correção automática" />
          <StatPill value="5+" label="Tipos de atividade" />
          <StatPill value="∞" label="Exercícios gerados" />
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────────────────── */}
      <section className="bg-muted/40 border-y">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <AnimateIn>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                O jeito tradicional de estudar não está funcionando
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Listas de exercícios genéricas, sem feedback real, sem
                acompanhamento do seu progresso. Você estuda horas e não sabe se
                realmente aprendeu.
              </p>
            </div>
          </AnimateIn>

          <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              {
                icon: "😩",
                title: "Exercícios repetitivos",
                text: "Conteúdo genérico que não acompanha o que você está estudando agora.",
                delay: 0,
              },
              {
                icon: "❌",
                title: "Sem feedback útil",
                text: 'Apenas "errado" ou "certo", sem explicar onde você errou e por quê.',
                delay: 80,
              },
              {
                icon: "📉",
                title: "Sem visão de progresso",
                text: "Impossível saber se você está evoluindo ou apenas ocupando tempo.",
                delay: 160,
              },
            ].map((item) => (
              <AnimateIn key={item.title} delay={item.delay}>
                <div className="rounded-xl border bg-card p-5 text-center h-full">
                  <p className="text-3xl mb-3">{item.icon}</p>
                  <p className="font-semibold text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <AnimateIn>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Tudo que você precisa para estudar melhor
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Ferramentas inteligentes que se adaptam ao seu ritmo e ao que você
              está estudando.
            </p>
          </div>
        </AnimateIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Dumbbell,
              title: "Exercícios com IA",
              description:
                "Gere exercícios de teoria, código ou múltipla escolha sobre qualquer tema. A IA corrige e explica cada resposta.",
              color: "bg-purple-100 text-purple-600",
              delay: 0,
            },
            {
              icon: GraduationCap,
              title: "Modo Prova",
              description:
                "Simule provas completas com tempo limite. Receba uma nota final e feedback detalhado em cada questão.",
              color: "bg-indigo-100 text-indigo-600",
              delay: 80,
            },
            {
              icon: Layers,
              title: "Flashcards Inteligentes",
              description:
                "Gere baralhos de flashcards automaticamente a partir de qualquer tema. Revise com flip cards interativos.",
              color: "bg-sky-100 text-sky-600",
              delay: 160,
            },
            {
              icon: BookOpen,
              title: "Resumos Completos",
              description:
                "A IA cria resumos estruturados, detalhados e prontos para revisar sobre qualquer assunto em segundos.",
              color: "bg-green-100 text-green-600",
              delay: 0,
            },
            {
              icon: CalendarDays,
              title: "Agenda de Estudos",
              description:
                "Planeje suas sessões por data e matéria. Acompanhe o andamento de cada plano e marque como concluído.",
              color: "bg-amber-100 text-amber-600",
              delay: 80,
            },
            {
              icon: Flame,
              title: "Sequência de Estudos",
              description:
                "Mantenha o foguinho aceso estudando todos os dias. Quanto mais dias consecutivos, mais pontos você acumula.",
              color: "bg-orange-100 text-orange-600",
              delay: 160,
            },
          ].map((card) => (
            <AnimateIn key={card.title} delay={card.delay}>
              <FeatureCard
                icon={card.icon}
                title={card.title}
                description={card.description}
                color={card.color}
              />
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="como-funciona" className="bg-muted/40 border-y">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <AnimateIn>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Como funciona
              </h2>
              <p className="text-muted-foreground">
                Simples, rápido e direto ao ponto.
              </p>
            </div>
          </AnimateIn>

          <div className="max-w-lg mx-auto space-y-8">
            {[
              {
                number: "1",
                title: "Crie sua conta",
                description:
                  "Use seu código de convite para criar uma conta. Leva menos de 1 minuto.",
                delay: 0,
              },
              {
                number: "2",
                title: "Informe o que está estudando",
                description:
                  "Diga a matéria e o tema. A IA gera exercícios, flashcards ou resumos personalizados na hora.",
                delay: 100,
              },
              {
                number: "3",
                title: "Pratique e acompanhe seu progresso",
                description:
                  "Resolva, receba feedback detalhado e veja sua evolução no dashboard com pontos e sequência de dias.",
                delay: 200,
              },
            ].map((step) => (
              <AnimateIn key={step.number} delay={step.delay}>
                <StepCard
                  number={step.number}
                  title={step.title}
                  description={step.description}
                />
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <AnimateIn>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Estude com propósito, não com esforço perdido
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                A plataforma foi criada para quem estuda sério — vestibular, concurso,
                faculdade ou desenvolvimento profissional. Cada minuto dedicado tem
                feedback real.
              </p>
              <ul className="space-y-3">
                {[
                  "Exercícios personalizados para o seu tema atual",
                  "Correção e feedback instantâneos com IA",
                  "Dashboard completo de progresso e pontuação",
                  "Streak diário para manter a consistência",
                  "Simulados com notas reais para medir preparo",
                  "Flashcards e resumos gerados em segundos",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimateIn>

          <AnimateIn delay={100}>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Brain,
                  title: "IA de ponta",
                  text: "Groq llama-3.3-70b gera conteúdo de alta qualidade em segundos.",
                  bg: "bg-purple-50",
                  ic: "text-purple-600",
                  border: "border-purple-100",
                },
                {
                  icon: Target,
                  title: "Conteúdo sob demanda",
                  text: "Exercícios criados para o tema exato que você está estudando.",
                  bg: "bg-blue-50",
                  ic: "text-blue-600",
                  border: "border-blue-100",
                },
                {
                  icon: TrendingUp,
                  title: "Progresso visível",
                  text: "Pontos, streaks e métricas para acompanhar sua evolução.",
                  bg: "bg-green-50",
                  ic: "text-green-600",
                  border: "border-green-100",
                },
                {
                  icon: Star,
                  title: "Gamificação real",
                  text: "Sistema de pontos e sequências que tornam o estudo mais motivador.",
                  bg: "bg-amber-50",
                  ic: "text-amber-600",
                  border: "border-amber-100",
                },
              ].map(({ icon: Icon, title, text, bg, ic, border }) => (
                <div
                  key={title}
                  className={`rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${border}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg} ${ic}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── CTA mid-page ─────────────────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground">
        <AnimateIn>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Pronto para estudar com IA?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Use seu código de convite e comece agora. É gratuito.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
                Criar conta com convite
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </AnimateIn>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <AnimateIn>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Perguntas frequentes
            </h2>
          </div>
        </AnimateIn>

        <div className="max-w-2xl mx-auto space-y-3">
          {[
            {
              question: "Como consigo um código de convite?",
              answer:
                "O Estudo+ é uma plataforma fechada. Para criar sua conta, você precisa de um código de convite fornecido por um usuário já cadastrado. Cada usuário pode gerar convites na seção de configurações.",
            },
            {
              question: "A plataforma é gratuita?",
              answer:
                "Sim. O Estudo+ é totalmente gratuito para quem possui um código de convite válido. Não há cobranças nem cartão de crédito necessário.",
            },
            {
              question: "Qual IA é usada para gerar o conteúdo?",
              answer:
                "Usamos o modelo llama-3.3-70b rodando na infraestrutura Groq, uma das IAs de linguagem mais avançadas disponíveis, com velocidade de geração extremamente rápida.",
            },
            {
              question: "Posso usar para qualquer matéria?",
              answer:
                "Sim. A IA gera exercícios, flashcards e resumos sobre qualquer tema que você informar — exatas, humanas, programação, idiomas, concursos, etc.",
            },
            {
              question: "Como funciona a correção automática?",
              answer:
                "Após responder um exercício, a IA avalia sua resposta e fornece feedback detalhado explicando onde você acertou, onde errou e como melhorar. Para questões de múltipla escolha, a correção é instantânea.",
            },
            {
              question: "O que é o modo prova?",
              answer:
                "O modo prova simula uma avaliação real com tempo limite, múltiplas questões e ao final gera uma nota de 0 a 100 com feedback individual para cada resposta.",
            },
            {
              question: "Os dados ficam salvos?",
              answer:
                "Sim. Todo o histórico de exercícios, flashcards, resumos e planos de estudo fica salvo na sua conta. Você pode acessar a qualquer momento.",
            },
          ].map((item, i) => (
            <AnimateIn key={item.question} delay={i * 50}>
              <FaqItem question={item.question} answer={item.answer} />
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-muted/40 border-t">
        <AnimateIn>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Comece a estudar de forma inteligente hoje
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Junte-se a quem já estuda com IA. Traga seu código de convite e crie
              sua conta em menos de 1 minuto.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2 text-base px-6">
                  Criar conta com convite
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-base px-6">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Estudo+</span>
          </div>
          <p>Plataforma pessoal de estudos com IA · {new Date().getFullYear()}</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Criar conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
