"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { generateBlessing } from "@/src/lib/blessing-engine";

const offerings = [
  {
    id: "traveler",
    numeral: "I",
    name: "Traveler's Offering",
    cnName: "旅人的供奉",
    meaning: "A small flame for the journey.",
    price: "5 USDC"
  },
  {
    id: "keeper",
    numeral: "II",
    name: "Keeper's Offering",
    cnName: "守火人的供奉",
    meaning: "Help the flame endure through the night.",
    price: "15 USDC"
  },
  {
    id: "sacred",
    numeral: "III",
    name: "Sacred Offering",
    cnName: "圣殿之火",
    meaning: "A brighter light for future travelers.",
    price: "35 USDC"
  },
  {
    id: "eternal",
    numeral: "IV",
    name: "Eternal Offering",
    cnName: "永恒之火",
    meaning: "Help keep the Shrine burning.",
    price: "88 USDC"
  }
];

const phases = {
  ARRIVAL: "arrival",
  OFFERING: "offering",
  PAYMENT: "payment",
  RITUAL: "ritual",
  BLESSING: "blessing",
  COMPLETE: "complete"
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export default function ShrinePage() {
  const [phase, setPhase] = useState(phases.ARRIVAL);
  const [selectedOffering, setSelectedOffering] = useState(offerings[0]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [blessing, setBlessing] = useState(null);
  const [doorOpen, setDoorOpen] = useState(false);
  const [flameLit, setFlameLit] = useState(false);
  const ritualLabel = useMemo(() => {
    if (phase === phases.RITUAL) return "The offering is received.";
    if (phase === phases.BLESSING) return "Blessing";
    if (phase === phases.COMPLETE) return "Journey Continued";
    if (phase === phases.OFFERING) return "Choose An Offering";
    return "The Threshold";
  }, [phase]);

  function openOfferings() {
    setPhase(phases.OFFERING);
    setDoorOpen(false);
    setFlameLit(false);
    setBlessing(null);
  }

  function openPayment() {
    setPaymentOpen(true);
    setPhase(phases.PAYMENT);
  }

  function completePayment() {
    setPaymentBusy(true);

    window.setTimeout(() => {
      setPaymentOpen(false);
      setPaymentBusy(false);
      setPhase(phases.RITUAL);
      setFlameLit(true);

      window.setTimeout(() => setDoorOpen(true), 900);
      window.setTimeout(() => {
        setBlessing(generateBlessing());
        setPhase(phases.BLESSING);
      }, 4300);
    }, 900);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06070b] text-stone-100">
      <NightSky />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 text-[0.68rem] uppercase tracking-[0.34em] text-amber-100/55">
          <span>Fortune Shrine</span>
          <span>{ritualLabel}</span>
        </header>

        <div className="grid flex-1 place-items-center py-10">
          <div className="w-full max-w-4xl">
            <div className="mb-6 text-center">
              <p className="sr-only">
                A Digital Shrine Before Uncertainty
              </p>
              <h1 className="mx-auto max-w-2xl font-serif text-[1.72rem] leading-[1.08] text-stone-50/90 sm:text-4xl lg:text-[3.65rem]">
                Before stepping into the unknown,
                <span className="block text-amber-100">receive a blessing.</span>
              </h1>
            </div>

            <div
              className={`sacred-scene relative mx-auto mb-8 grid min-h-[360px] max-w-2xl place-items-center rounded-[2rem] border border-amber-200/15 bg-black/20 p-6 shadow-2xl shadow-black/50 backdrop-blur-md sm:min-h-[440px] ${
                flameLit || phase === phases.BLESSING ? "sacred-scene-received" : ""
              }`}
            >
              <DoorOfTheUnknown open={doorOpen} />
              <SacredFlame lit={flameLit || phase === phases.BLESSING} />
              {phase === phases.RITUAL ? <RitualParticles /> : null}
            </div>

            {phase === phases.ARRIVAL ? (
              <Arrival onEnter={openOfferings} />
            ) : null}

            {phase === phases.OFFERING || phase === phases.PAYMENT ? (
              <OfferingSelection
                offerings={offerings}
                selectedOffering={selectedOffering}
                onSelect={setSelectedOffering}
                onOpenPayment={openPayment}
              />
            ) : null}

            {phase === phases.RITUAL ? <RitualStatus /> : null}

            {phase === phases.BLESSING && blessing ? (
              <BlessingDisplay blessing={blessing} onContinue={() => setPhase(phases.COMPLETE)} />
            ) : null}

            {phase === phases.COMPLETE ? (
              <Completion />
            ) : null}
          </div>
        </div>
      </section>

      {paymentOpen ? (
        <PaymentModal
          offering={selectedOffering}
          busy={paymentBusy}
          onCancel={() => {
            setPaymentOpen(false);
            setPhase(phases.OFFERING);
          }}
          onComplete={completePayment}
        />
      ) : null}
    </main>
  );
}

function NightSky() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(105,82,42,0.22),transparent_28%),radial-gradient(circle_at_50%_86%,rgba(23,19,35,0.7),transparent_44%),linear-gradient(180deg,#08090f,#020307_72%)]" />
      <div className="stars-layer stars-layer-one" />
      <div className="stars-layer stars-layer-two" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/60 to-transparent" />
    </div>
  );
}

function DoorOfTheUnknown({ open }) {
  return (
    <div className={`door-of-unknown ${open ? "door-open" : ""}`} aria-hidden="true">
      <div className="door-panel door-panel-left" />
      <div className="door-panel door-panel-right" />
      <div className="door-inner-shadow" />
    </div>
  );
}

function SacredFlame({ lit }) {
  const flameRef = useRef(null);

  useEffect(() => {
    if (!flameRef.current) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let motionTimer;
    let restTimer;
    const flame = flameRef.current;

    function setFlameVariables({
      auraOpacity,
      auraScale,
      brightness,
      saturation,
      rise,
      lean,
      backScale,
      frontScale,
      baseOpacity,
      baseScale
    }) {
      flame.style.setProperty("--flame-aura-opacity", auraOpacity.toFixed(3));
      flame.style.setProperty("--flame-aura-scale", auraScale.toFixed(3));
      flame.style.setProperty("--flame-brightness", brightness.toFixed(3));
      flame.style.setProperty("--flame-saturation", saturation.toFixed(3));
      flame.style.setProperty("--flame-rise", `${rise.toFixed(1)}px`);
      flame.style.setProperty("--flame-lean", `${lean.toFixed(2)}deg`);
      flame.style.setProperty("--flame-back-scale", backScale.toFixed(3));
      flame.style.setProperty("--flame-front-scale", frontScale.toFixed(3));
      flame.style.setProperty("--flame-base-opacity", baseOpacity.toFixed(3));
      flame.style.setProperty("--flame-base-scale", baseScale.toFixed(3));
    }

    function setIdleFlame() {
      setFlameVariables({
        auraOpacity: randomBetween(0.52, 0.59),
        auraScale: randomBetween(0.96, 1.04),
        brightness: randomBetween(0.95, 1.02),
        saturation: randomBetween(0.98, 1.04),
        rise: randomBetween(-2.2, 1.2),
        lean: randomBetween(-2.6, 2.2),
        backScale: randomBetween(0.98, 1.025),
        frontScale: randomBetween(0.97, 1.035),
        baseOpacity: randomBetween(0.68, 0.8),
        baseScale: randomBetween(0.96, 1.04)
      });
    }

    function scheduleLivingFlame() {
      setIdleFlame();
      motionTimer = window.setTimeout(scheduleLivingFlame, randomBetween(850, 2600));
    }

    if (lit) {
      setFlameVariables({
        auraOpacity: randomBetween(0.66, 0.72),
        auraScale: randomBetween(1.08, 1.16),
        brightness: randomBetween(1.1, 1.15),
        saturation: randomBetween(1.04, 1.08),
        rise: randomBetween(-7, -4),
        lean: randomBetween(-1.2, 1.2),
        backScale: randomBetween(1.08, 1.15),
        frontScale: randomBetween(1.08, 1.15),
        baseOpacity: randomBetween(0.86, 0.92),
        baseScale: randomBetween(1.05, 1.12)
      });
      restTimer = window.setTimeout(scheduleLivingFlame, randomBetween(3600, 5600));
    } else {
      scheduleLivingFlame();
    }

    return () => {
      window.clearTimeout(motionTimer);
      window.clearTimeout(restTimer);
    };
  }, [lit]);

  return (
    <div ref={flameRef} className={`sacred-flame ${lit ? "sacred-flame-lit" : ""}`} aria-hidden="true">
      <div className="flame-aura" />
      <div className="flame-body flame-body-back" />
      <div className="flame-body flame-body-front" />
      <div className="flame-base" />
    </div>
  );
}

function RitualParticles() {
  return (
    <div className="ritual-particles" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function Arrival({ onEnter }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <p className="sr-only">
        Choose a flame to light. The blessing follows the flame.
      </p>
      <button className="quiet-button min-h-9 px-5 text-[0.66rem] sm:w-auto" type="button" onClick={onEnter}>
        Light The Flame
      </button>
      <p className="sr-only">
        You are not buying words.
      </p>
    </div>
  );
}

function OfferingSelection({ offerings, selectedOffering, onSelect, onOpenPayment }) {
  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-5 text-center">
        <p className="text-xs uppercase tracking-[0.34em] text-amber-200/55">Light The Flame</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {offerings.map((offering) => {
          const selected = selectedOffering.id === offering.id;

          return (
            <button
              className={`offering-card ${selected ? "offering-card-selected" : ""}`}
              key={offering.id}
              type="button"
              onClick={() => onSelect(offering)}
            >
              <span className="offering-numeral">{offering.numeral}</span>
              <span className="font-serif text-xl text-stone-50">{offering.name}</span>
              <span className="text-xs tracking-[0.12em] text-amber-100/55">{offering.cnName}</span>
              <span className="text-sm leading-6 text-stone-300/72">{offering.meaning}</span>
              <span className="pt-1 text-xs uppercase tracking-[0.22em] text-amber-100/70">
                {offering.price}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-5 text-center">
        <button className="shrine-button w-full sm:w-auto" type="button" onClick={onOpenPayment}>
          Light The Flame
        </button>
      </div>
    </section>
  );
}

function PaymentModal({ offering, busy, onCancel, onComplete }) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/72 px-5 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-[1.7rem] border border-amber-200/20 bg-[#0d0b09]/95 p-6 shadow-2xl shadow-black">
        <p className="mb-3 text-xs uppercase tracking-[0.34em] text-amber-200/55">Offering</p>
        <h2 className="font-serif text-3xl text-stone-50">{offering.name}</h2>
        <p className="mt-3 leading-7 text-stone-300/72">{offering.meaning}</p>
        <div className="my-6 rounded-2xl border border-amber-200/15 bg-white/[0.03] p-4">
          <span className="block text-xs uppercase tracking-[0.22em] text-stone-400">Offering</span>
          <strong className="mt-2 block text-2xl font-normal text-amber-100">{offering.price}</strong>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="quiet-button" type="button" onClick={onCancel} disabled={busy}>
            Return
          </button>
          <button className="shrine-button" type="button" onClick={onComplete} disabled={busy}>
            {busy ? "Offering..." : "Offer The Flame"}
          </button>
        </div>
      </section>
    </div>
  );
}

function RitualStatus() {
  return (
    <div className="mx-auto max-w-md text-center">
      <p className="mb-3 text-xs uppercase tracking-[0.34em] text-amber-200/55">
        The offering is received.
      </p>
      <h2 className="font-serif text-3xl text-stone-50">The Eternal Flame grows brighter.</h2>
      <p className="mt-4 leading-7 text-stone-300/72">The door opens slowly. The Shrine keeps silence.</p>
    </div>
  );
}

function BlessingDisplay({ blessing, onContinue }) {
  return (
    <section className="mx-auto max-w-2xl text-center">
      <div className="space-y-7 font-serif leading-tight text-stone-50">
        <p className="text-2xl text-stone-100/70 sm:text-3xl">{blessing.recognition}</p>
        <p className="text-5xl leading-none tracking-[-0.045em] text-amber-100 sm:text-7xl">{blessing.blessing}</p>
        <p className="text-lg leading-8 text-stone-200/50 sm:text-2xl">{blessing.mystery}</p>
      </div>
      <button className="quiet-button mt-9" type="button" onClick={onContinue}>
        Continue Journey
      </button>
    </section>
  );
}

function Completion() {
  return (
    <section className="mx-auto max-w-md text-center">
      <p className="mb-3 text-xs uppercase tracking-[0.34em] text-amber-200/55">
        Journey Continued
      </p>
    </section>
  );
}
