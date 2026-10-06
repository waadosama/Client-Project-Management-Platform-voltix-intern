import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Features from "./components/Features.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import Stats from "./components/Stats.jsx";
import CallToAction from "./components/CallToAction.jsx";
import Footer from "./components/Footer.jsx";
import { fetchIntro } from "./services/api.js";
import { DEFAULT_INTRO } from "./data/fallback.js";

export default function App() {
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [source, setSource] = useState("fallback");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchIntro()
      .then((res) => {
        if (cancelled) return;
        if (res?.data) {
          setIntro(res.data);
          setSource(res.source);
        }
      })
      .catch(() => {
        if (!cancelled) setSource("offline");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`app ${loading ? "is-loading" : ""}`}>
      <Navbar brand={intro.brand} tagline={intro.tagline} />
      <main>
        <Hero hero={intro.hero} />
        <Stats stats={intro.stats} />
        <Features features={intro.features} />
        <HowItWorks steps={intro.steps} />
        <CallToAction cta={intro.cta} />
      </main>
      <Footer brand={intro.brand} tagline={intro.tagline} source={source} />
    </div>
  );
}
