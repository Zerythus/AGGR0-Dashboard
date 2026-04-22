import styles from './homeHero.module.css';
import { useEffect, useState } from "react";

export default function HomeHero() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section className={`flex flex-col justify-start h-full bg-linear-to-b from-(--background-inner-color) from-10% to-(--background-color2) ${styles.section}`}>
      <div className={styles.logo}>
        <img src="/logo/aggr0-logo.png" alt="AGGR0 Logo" className="h-10 w-50" />
      </div>

      {!isMobile && (
        <div className="flex flex-col items-center justify-center text-center flex-1">
          <h1 className="text-5xl font-medium tracking-tight mt-8">
            Hundreds of games tracked
          </h1>
          <p className="mt-6 max-w-lg text-xl text-white/75">
            Understand your gaming habits with playtime and measure your investments in games
          </p>
          <img
            src="/img/HomeImg.png"
            alt="Home Image"
            className={`mt-10 rounded-sm ${styles.heroImage}`}
          />
        </div>
      )}
    </section>
  );
}