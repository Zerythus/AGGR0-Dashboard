export default function HomeHero() {

  return (
    <section className="flex h-full flex-col bg-linear-to-b from-(--background-inner-color) from-10% to-(--background-color2) px-10 py-10">
      <div className="flex justify-start">
          <img src="/logo/aggr0-logo.png" alt="AGGR0 Logo" className="h-15 w-50" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-medium tracking-tight mt-8">
          Hundreds of games tracked
        </h1>
        <p className="mt-6 max-w-lg text-xl text-white/75">
          Understand your gaming habits with playtime and measure your investments in games
        </p>
        <img src="/img/HomeImg.png" alt="Home Image" className="mt-10 h-105 w-full rounded-sm " />
      </div>
    </section>
    );
}